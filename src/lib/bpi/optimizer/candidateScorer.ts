import { BpiCalculator } from "@/lib/bpi";
import { BpiOptimizerConstants } from "./constants";
import { resolveCeilingBpi } from "./achievementCeiling";
import { predictUnplayedBpi } from "./unplayedPrediction";
import { LatentSkillModel } from "./latentSkillModel";
import { TotalBpiEvaluator } from "./totalBpiEvaluator";
import type { SongOptimizerInput } from "@/types/bpi-optimizer";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

export interface ScoredCandidate {
  song: SongOptimizerInput;
  toExScore: number;
  actualToBpi: number;
  trueBpiGain: number;
  /** 真の効率（trueBpiGain/exGain）。ステップの表示・記録用の値。 */
  efficiency: number;
  /** 選出用スコア。並べ替え専用（`efficiency`に多様性ボーナスを掛けたもの）。 */
  rankingScore: number;
}

/**
 * 未プレイ・「現在の総合BPIをまだ下回っている」候補への効率ランキング倍率。
 * flexibleモードの最終スコアにのみ掛ける、あくまで同点付近のタイブレーク用（fastestでは使わない）。
 */
export function diversityMultiplier(song: SongOptimizerInput, currentSongBpi: number, currentTotal: number): number {
  let multiplier = 1;
  if (song.currentExScore == null) multiplier += BpiOptimizerConstants.DIVERSITY_UNPLAYED_BONUS;
  if (currentSongBpi < currentTotal) multiplier += BpiOptimizerConstants.DIVERSITY_HEADROOM_BONUS;
  return multiplier;
}

/**
 * 候補曲を2段階で評価する（提案書§3.5）。
 *
 * **ペース配分（flexibleモードの核）**: 1曲の目標BPIを`achievementCeiling`が返す
 * 「この曲でどこまで伸ばせるか」の上限（marginCeiling）にそのまま張り付かせると、
 * 総合BPIへの寄与が一番大きい1曲だけがその上限まで刻まれ続け、(a) 他の曲が選ばれない
 * （多様性ボーナス程度では上位曲支配の桁違いのスケール差を覆せない）、
 * (b) 逆にmarginCeilingを軽視すると総合BPIへの寄与がほぼ無い曲ばかりになり
 * maxSteps以内に目標へ収束しない、という状態を両方とも実測で確認した
 * （`docs/proposals/bpi-optimizer-v2-rebuild.md`のユーザーフィードバック参照）。
 *
 * 解決策は「残りの目標ギャップを残りステップ数で均等割りした量」を1ステップの
 * 目標寄与（`desiredStepGain`）とし、各候補の目標BPIをそれで賄える分だけに
 * ペース配分すること（V1時代の`estimateTargetBpi`のremainingSumGap/remainingSteps
 * ペース配分と同じ発想を、V1のべき乗平均ではなく実際のV2総合BPIの解析的勾配で行う）。
 * これにより:
 * - どの曲を選んでも1ステップあたりの総合BPIへの寄与がほぼ`desiredStepGain`に揃うため、
 *   1曲だけに寄与が集中しなくなる（自然にmaxSteps曲程度に分散する）
 * - 毎ステップ「残りギャップ／残りステップ」だけ確実に進むため、候補が尽きない限り
 *   maxSteps以内に目標へ到達する
 *
 * fastest（スパルタ/最短経路）はペース配分せず、`achievementCeiling`の上限まで
 * そのまま狙う（最少曲数での最短到達を優先する、というモードの意味通り）。
 *
 * 1. 安価な一次選抜（候補全件、O(候補数)）: 見積もり効率で上位`CANDIDATE_POOL_SIZE`件に絞る
 * 2. 厳密評価（上位K件のみ、O(K×n log n)）: 実際に観測へ仮想プレイを追加して
 *    `TotalBpiEvaluator.exact`を呼び、真の総合BPI増分で並べ替える
 */
export class CandidateScorer {
  constructor(
    private readonly totalEvaluator: TotalBpiEvaluator,
    private readonly latentSkill: LatentSkillModel,
  ) {}

  scoreTopCandidates(
    candidates: SongOptimizerInput[],
    observations: Map<number, IBpiScoreObservation>,
    allSongs: (IBpiBasicSongData & { songId: number })[],
    currentTotal: number,
    targetTotalValue: number,
    considerCurrentTotalBpi: boolean,
    searchMode: "fastest" | "flexible" | undefined,
    remainingSteps: number,
  ): ScoredCandidate[] {
    const kPrime = this.totalEvaluator.shiftedPowerMeanExponent;
    const aShrunk = this.latentSkill.aShrunk;
    const paced = searchMode !== "fastest";
    const desiredStepGain = Math.max(
      1e-6,
      (targetTotalValue - currentTotal) / Math.max(1, remainingSteps),
    );

    const cheap = candidates.flatMap((song) => {
      const chartParams = BpiCalculator.getSongParams(song);
      if (!chartParams) return [];

      const marginCeilingBpi = resolveCeilingBpi(
        song,
        chartParams,
        this.latentSkill,
        targetTotalValue,
        considerCurrentTotalBpi,
      );

      const currentSongBpi =
        song.currentExScore != null
          ? (BpiCalculator.calc(song.currentExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR)
          : predictUnplayedBpi(chartParams, aShrunk ?? 0, this.latentSkill.confidence);

      const gradient = this.totalEvaluator.marginalGainEstimate(currentTotal, currentSongBpi, kPrime);

      // ペース配分: この曲だけでdesiredStepGain分を稼ぐのに必要な自曲BPI増分を、
      // 解析的勾配(gradient = ∂T/∂BPI_i)の逆数で見積もり、marginCeilingを上限にする。
      // 残りギャップが小さくなるほどdesiredStepGainも縮むため、下限をMIN_BPI_GAINで
      // 確保しておく（そうしないと目標間際でどの候補も「増分が小さすぎる」として
      // 下のMIN_EX_GAIN/MIN_BPI_GAINチェックに弾かれ、候補が残っているのに
      // 探索が早期終了してしまう）。
      const pacedOwnDelta = gradient > 0 ? desiredStepGain / gradient : Infinity;
      const pacedTarget =
        currentSongBpi + Math.max(BpiOptimizerConstants.MIN_BPI_GAIN, pacedOwnDelta);
      const ceilingBpi = paced ? Math.min(marginCeilingBpi, pacedTarget) : marginCeilingBpi;

      const toExScore = BpiCalculator.calcFromBPI(ceilingBpi, song) ?? song.notes * 2;
      const currentExScore = song.currentExScore ?? 0;
      const exGain = toExScore - currentExScore;
      const ownGain = ceilingBpi - currentSongBpi;

      if (exGain < BpiOptimizerConstants.MIN_EX_GAIN && ownGain < BpiOptimizerConstants.MIN_BPI_GAIN) {
        return [];
      }

      const estimatedTotalGain = gradient * Math.max(0, ownGain);
      const estimatedEfficiency = estimatedTotalGain / Math.max(1, exGain);
      const estimatedRankingScore = paced
        ? estimatedEfficiency * diversityMultiplier(song, currentSongBpi, currentTotal)
        : estimatedEfficiency;

      return [{ song, toExScore, estimatedRankingScore }];
    });

    cheap.sort((a, b) => b.estimatedRankingScore - a.estimatedRankingScore);
    const pool = cheap.slice(0, BpiOptimizerConstants.CANDIDATE_POOL_SIZE);

    const exact: ScoredCandidate[] = pool.map(({ song, toExScore }) => {
      const hypothetical = new Map(observations);
      hypothetical.set(song.songId, { songId: song.songId, notes: song.notes, exScore: toExScore });
      const exactTotal = this.totalEvaluator.exact([...hypothetical.values()], allSongs);
      const trueBpiGain = exactTotal - currentTotal;
      const exGain = Math.max(1, toExScore - (song.currentExScore ?? 0));
      const actualToBpi = BpiCalculator.calc(toExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR;
      const efficiency = trueBpiGain / exGain;
      const currentSongBpi = song.currentExScore != null ? song.currentBpi : BpiOptimizerConstants.BPI_FLOOR;
      const rankingScore = paced
        ? efficiency * diversityMultiplier(song, currentSongBpi, currentTotal)
        : efficiency;
      return { song, toExScore, actualToBpi, trueBpiGain, efficiency, rankingScore };
    });

    exact.sort((a, b) => b.rankingScore - a.rankingScore);
    return exact;
  }
}
