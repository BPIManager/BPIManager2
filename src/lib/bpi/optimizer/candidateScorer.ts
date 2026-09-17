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

/** ランキング前の候補1件分の生データ（cheap/exact両フェーズで共通の形）。 */
interface CandidateRow {
  song: SongOptimizerInput;
  toExScore: number;
  currentSongBpi: number;
  /** 総合BPIへの寄与（cheapフェーズは解析的勾配による見積もり、exactフェーズは厳密値）。 */
  totalGain: number;
  /** 曲自身のBPI増分（EXスコア変換前）。 */
  ownGain: number;
  exGain: number;
}

/**
 * 未プレイ・「現在の総合BPIをまだ下回っている」候補への効率ランキング倍率。
 * flexibleモードの最終スコアにのみ掛ける（fastestでは使わない）。
 */
export function diversityMultiplier(song: SongOptimizerInput, currentSongBpi: number, currentTotal: number): number {
  let multiplier = 1;
  if (song.currentExScore == null) multiplier += BpiOptimizerConstants.DIVERSITY_UNPLAYED_BONUS;
  if (currentSongBpi < currentTotal) multiplier += BpiOptimizerConstants.DIVERSITY_HEADROOM_BONUS;
  return multiplier;
}

/**
 * 候補群を並べ替え用のスコアでランキングする。
 *
 * - fastest（スパルタ/最短経路）: `totalGain/exGain`（総合BPIへの寄与をそのまま最大化する、
 *   上位曲支配の偏りを補正しない「真の効率」）で並べ替える
 * - flexible（複数曲に分散）: `totalGain/exGain`と`ownGain/exGain`の両方を候補プール内の
 *   最大値で正規化（0〜1）してから`FLEXIBLE_TOTAL_IMPACT_WEIGHT`で加重和を取り、
 *   多様性ボーナスを掛ける
 *
 * flexibleで正規化してから混ぜる理由: シフト法べき乗平均（`docs/bpi-math.md` §4.3）の
 * 「上位曲支配」により`totalGain`は候補間で数桁のスケール差になりうる（実測確認済み）。
 * 生のtotalGainのまま`ownGain`と混ぜる・多様性ボーナスを掛けるだけでは、この桁違いの
 * スケール差の前でほぼ無力（ボーナスが数十%程度では焼け石に水）。かといって
 * `ownGain`だけで選ぶと総合BPIへの寄与がほぼ無い曲ばかりになり目標に収束しなくなる
 * （両方とも実際の実行結果で確認済み）。候補プール内で最大1に正規化してから加重和を
 * 取ることで、スケール差を消した上で両方の観点を対等な重みで反映できる。
 */
function rankByMode(
  rows: CandidateRow[],
  searchMode: "fastest" | "flexible" | undefined,
  currentTotal: number,
): (CandidateRow & { rankingScore: number })[] {
  if (searchMode === "fastest") {
    return rows.map((r) => ({ ...r, rankingScore: r.totalGain / r.exGain }));
  }

  const maxTotalEff = Math.max(...rows.map((r) => Math.max(0, r.totalGain) / r.exGain), 1e-9);
  const maxOwnEff = Math.max(...rows.map((r) => Math.max(0, r.ownGain) / r.exGain), 1e-9);
  const w = BpiOptimizerConstants.FLEXIBLE_TOTAL_IMPACT_WEIGHT;

  return rows.map((r) => {
    const totalEffNorm = (Math.max(0, r.totalGain) / r.exGain) / maxTotalEff;
    const ownEffNorm = (Math.max(0, r.ownGain) / r.exGain) / maxOwnEff;
    const blended = w * totalEffNorm + (1 - w) * ownEffNorm;
    const rankingScore = blended * diversityMultiplier(r.song, r.currentSongBpi, currentTotal);
    return { ...r, rankingScore };
  });
}

/**
 * 候補曲を2段階で評価する（提案書§3.5、モード別ランキングは上記`rankByMode`参照）。
 *
 * 1. 安価な一次選抜（候補全件、O(候補数)）: 解析的勾配による見積もりスコアで
 *    上位`CANDIDATE_POOL_SIZE`件に絞る
 * 2. 厳密評価（上位K件のみ、O(K×n log n)）: 実際に観測へ仮想プレイを追加して
 *    `TotalBpiEvaluator.exact`を呼び、真のスコアで並べ替える
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

    const cheapRows: CandidateRow[] = candidates.flatMap((song) => {
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
      const ownGain = ceilingBpi - currentSongBpi;

      if (exGain < BpiOptimizerConstants.MIN_EX_GAIN && ownGain < BpiOptimizerConstants.MIN_BPI_GAIN) {
        return [];
      }

      const gradient = this.totalEvaluator.marginalGainEstimate(currentTotal, currentSongBpi, kPrime);
      const totalGain = gradient * Math.max(0, ownGain);

      return [{ song, toExScore, currentSongBpi, totalGain, ownGain, exGain: Math.max(1, exGain) }];
    });

    const rankedCheap = rankByMode(cheapRows, searchMode, currentTotal);
    rankedCheap.sort((a, b) => b.rankingScore - a.rankingScore);
    const pool = rankedCheap.slice(0, BpiOptimizerConstants.CANDIDATE_POOL_SIZE);

    const exactRows: CandidateRow[] = pool.map(({ song, toExScore, currentSongBpi }) => {
      const hypothetical = new Map(observations);
      hypothetical.set(song.songId, { songId: song.songId, notes: song.notes, exScore: toExScore });
      const exactTotal = this.totalEvaluator.exact([...hypothetical.values()], allSongs);
      const trueBpiGain = exactTotal - currentTotal;
      const exGain = Math.max(1, toExScore - (song.currentExScore ?? 0));
      const actualToBpi = BpiCalculator.calc(toExScore, song) ?? BpiOptimizerConstants.BPI_FLOOR;
      const ownGain = actualToBpi - currentSongBpi;
      return { song, toExScore, currentSongBpi, totalGain: trueBpiGain, ownGain, exGain };
    });

    const rankedExact = rankByMode(exactRows, searchMode, currentTotal);
    const exact: ScoredCandidate[] = rankedExact.map((r) => ({
      song: r.song,
      toExScore: r.toExScore,
      actualToBpi: r.currentSongBpi + r.ownGain,
      trueBpiGain: r.totalGain,
      efficiency: r.totalGain / r.exGain,
      rankingScore: r.rankingScore,
    }));

    exact.sort((a, b) => b.rankingScore - a.rankingScore);
    return exact;
  }
}
