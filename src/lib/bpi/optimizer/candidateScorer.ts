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
  /** 多様性ボーナス込みの選出用スコア（`efficiency`に倍率をかけたもの）。並べ替え専用。 */
  rankingScore: number;
}

/**
 * 未プレイ・「現在の総合BPIをまだ下回っている」候補への効率ランキング倍率（提案書への
 * ユーザー指摘への対応。`BpiOptimizerConstants`のコメント参照）。
 * `efficiency`自体は変えず、選ばれやすさ（並べ替え順）だけに掛ける。
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
 * 1. 安価な一次選抜（候補全件、O(候補数)）: 解析的勾配（`TotalBpiEvaluator.marginalGainEstimate`）
 *    による見積もり効率×多様性ボーナスで上位`CANDIDATE_POOL_SIZE`件に絞る
 * 2. 厳密評価（上位K件のみ、O(K×n log n)）: 実際に観測へ仮想プレイを追加して
 *    `TotalBpiEvaluator.exact`を呼び、真の総合BPI増分×多様性ボーナスで並べ替える
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
      const exGain = toExScore - currentExScore;

      const currentSongBpi =
        song.currentExScore != null
          ? (BpiCalculator.calc(song.currentExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR)
          : predictUnplayedBpi(chartParams, aShrunk ?? 0, this.latentSkill.confidence);

      if (exGain < BpiOptimizerConstants.MIN_EX_GAIN && ceilingBpi - currentSongBpi < BpiOptimizerConstants.MIN_BPI_GAIN) {
        return [];
      }

      const gradient = this.totalEvaluator.marginalGainEstimate(currentTotal, currentSongBpi, kPrime);
      const estimatedGain = gradient * Math.max(0, ceilingBpi - currentSongBpi);
      const estimatedEfficiency = estimatedGain / Math.max(1, exGain);
      const estimatedRankingScore =
        estimatedEfficiency * diversityMultiplier(song, currentSongBpi, currentTotal);

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
      const rankingScore = efficiency * diversityMultiplier(song, currentSongBpi, currentTotal);
      return { song, toExScore, actualToBpi, trueBpiGain, efficiency, rankingScore };
    });

    exact.sort((a, b) => b.rankingScore - a.rankingScore);
    return exact;
  }
}
