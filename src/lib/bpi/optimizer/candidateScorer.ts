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
  /** 真の効率（trueBpiGain/exGain）。ステップの表示・記録用の、補正前の値。 */
  efficiency: number;
  /** 探索モードに応じた選出用スコア。並べ替え専用（`efficiency`とは意味が異なりうる）。 */
  rankingScore: number;
}

/**
 * 未プレイ・「現在の総合BPIをまだ下回っている」候補への効率ランキング倍率。
 * `efficiency`自体は変えず、選ばれやすさ（並べ替え順）だけに掛ける。
 */
export function diversityMultiplier(song: SongOptimizerInput, currentSongBpi: number, currentTotal: number): number {
  let multiplier = 1;
  if (song.currentExScore == null) multiplier += BpiOptimizerConstants.DIVERSITY_UNPLAYED_BONUS;
  if (currentSongBpi < currentTotal) multiplier += BpiOptimizerConstants.DIVERSITY_HEADROOM_BONUS;
  return multiplier;
}

/**
 * 探索モードに応じたランキング指標を選ぶ。
 *
 * - fastest（スパルタ/最短経路）: `totalBpiGain / exGain`（総合BPIへの寄与を直接最大化する、
 *   偏りを補正しない「真の効率」）
 * - flexible（複数曲に分散）: `ownBpiGain / exGain`（その曲**自身**のBPIがEXスコア1点あたり
 *   どれだけ伸びるかという、曲間で公平な指標）に多様性ボーナスを掛けたもの
 *
 * シフト法べき乗平均（`docs/bpi-math.md` §4.3）は総合BPIより既に高い曲ほど
 * `∂T/∂BPI_i`が大きい「上位曲支配」の性質を持つため、`totalBpiGain`をそのまま
 * 並べ替えに使うと（fastestはそれでよいが）flexibleでも同じ曲ばかりが選ばれ続けて
 * しまう。`ownBpiGain`はこの偏り（総合BPI側の重み付け）を含まない、曲固有のスコア
 * カーブの急峻さだけを反映する量なので、flexibleでは意図通り曲間で公平に働く。
 */
function rankingScoreOf(
  searchMode: "fastest" | "flexible" | undefined,
  totalBpiGain: number,
  ownBpiGain: number,
  exGain: number,
  song: SongOptimizerInput,
  currentSongBpi: number,
  currentTotal: number,
): number {
  if (searchMode === "fastest") {
    return totalBpiGain / exGain;
  }
  return (Math.max(0, ownBpiGain) / exGain) * diversityMultiplier(song, currentSongBpi, currentTotal);
}

/**
 * 候補曲を2段階で評価する（提案書§3.5、モード別ランキングは上記`rankingScoreOf`参照）。
 *
 * 1. 安価な一次選抜（候補全件、O(候補数)）: 見積もりランキングスコアで上位
 *    `CANDIDATE_POOL_SIZE`件に絞る
 * 2. 厳密評価（上位K件のみ、O(K×n log n)）: 実際に観測へ仮想プレイを追加して
 *    `TotalBpiEvaluator.exact`を呼び、真のランキングスコアで並べ替える
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
  ): ScoredCandidate[] {
    const kPrime = this.totalEvaluator.shiftedPowerMeanExponent;
    const aShrunk = this.latentSkill.aShrunk;

    const cheap = candidates.flatMap((song) => {
      const chartParams = BpiCalculator.getSongParams(song);
      if (!chartParams) return [];

      const ceilingBpi = resolveCeilingBpi(
        song,
        chartParams,
        this.latentSkill,
        targetTotalValue,
        considerCurrentTotalBpi,
      );
      const toExScore = BpiCalculator.calcFromBPI(ceilingBpi, song) ?? song.notes * 2;
      const currentExScore = song.currentExScore ?? 0;
      const exGain = Math.max(1, toExScore - currentExScore);

      const currentSongBpi =
        song.currentExScore != null
          ? (BpiCalculator.calc(song.currentExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR)
          : predictUnplayedBpi(chartParams, aShrunk ?? 0, this.latentSkill.confidence);
      const ownBpiGain = ceilingBpi - currentSongBpi;

      if (toExScore - currentExScore < BpiOptimizerConstants.MIN_EX_GAIN && ownBpiGain < BpiOptimizerConstants.MIN_BPI_GAIN) {
        return [];
      }

      const gradient = this.totalEvaluator.marginalGainEstimate(currentTotal, currentSongBpi, kPrime);
      const estimatedTotalGain = gradient * Math.max(0, ownBpiGain);
      const estimatedRankingScore = rankingScoreOf(
        searchMode,
        estimatedTotalGain,
        ownBpiGain,
        exGain,
        song,
        currentSongBpi,
        currentTotal,
      );

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
      const ownBpiGain = actualToBpi - currentSongBpi;
      const rankingScore = rankingScoreOf(
        searchMode,
        trueBpiGain,
        ownBpiGain,
        exGain,
        song,
        currentSongBpi,
        currentTotal,
      );
      return { song, toExScore, actualToBpi, trueBpiGain, efficiency, rankingScore };
    });

    exact.sort((a, b) => b.rankingScore - a.rankingScore);
    return exact;
  }
}
