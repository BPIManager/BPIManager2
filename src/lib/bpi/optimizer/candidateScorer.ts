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
 * flexibleは各曲の目標BPIを`achievementCeiling`の上限までではなく、残りギャップを
 * 残りステップで均等割りした分（`desiredStepGain`）に頭打ちする（ペース配分）。
 * これで1曲に寄与が集中せず、かつ毎ステップ着実に進むので収束もする。fastestは
 * ペース配分せず上限まで狙う（最短到達優先）。
 *
 * 1. 安価な一次選抜（候補全件）: 見積もり効率で上位`CANDIDATE_POOL_SIZE`件に絞る
 * 2. 厳密評価（上位K件のみ）: 実際に観測へ反映して`TotalBpiEvaluator.exact`で
 *    真の総合BPI増分を求め、並べ替える
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
