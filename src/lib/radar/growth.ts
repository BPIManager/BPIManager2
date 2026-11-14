import type { RadarCategory } from "@/types/stats/radar";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import {
  calculateCategoryTotalBpi,
  type RadarSongMaster,
} from "@/lib/radar/calculator";
import type {
  RadarGrowthSnapshot,
  RadarGrowthSong,
} from "@/types/logs/radarGrowth";

interface SnapshotScore {
  songId: number;
  title: string;
  difficulty: string | null;
  exScore: number;
  bpi: number | null;
  notes: number | null;
}

interface PeriodScore extends SnapshotScore {
  prevExScore: number | null;
  prevBpi: number | null;
}

/**
 * 期間終了時点のスナップショットから、期間内の更新を巻き戻した（更新前の）スコア一覧を作る。
 * 期間内に初めて記録された曲（prevExScore が null）は更新前には存在しないため除外する。
 */
export function buildBeforeScores(
  after: SnapshotScore[],
  period: PeriodScore[],
): SnapshotScore[] {
  const periodBySong = new Map(period.map((p) => [p.songId, p]));
  return after.flatMap((s) => {
    const p = periodBySong.get(s.songId);
    if (!p) return [s];
    if (p.prevExScore == null) return [];
    return [{ ...s, exScore: p.prevExScore, bpi: p.prevBpi }];
  });
}

/** カテゴリごとの before/after/差分を組み立てる */
export function buildRadarGrowthSnapshot(
  before: Record<RadarCategory, { totalBpi: number }>,
  after: Record<RadarCategory, { totalBpi: number }>,
): RadarGrowthSnapshot {
  const categories = Object.keys(after) as RadarCategory[];
  return {
    categories: categories.map((category) => ({
      category,
      before: before[category].totalBpi,
      after: after[category].totalBpi,
      diff: after[category].totalBpi - before[category].totalBpi,
    })),
  };
}

/**
 * 期間内に更新された曲のうち指定カテゴリの曲について、更新前後のスコアと、カテゴリ総合BPIへのインパクトを求める。
 * インパクトは「期間終了時点の総合BPI − その曲の更新だけを巻き戻した総合BPI」。曲間で非加法のため合計は総伸びと一致しない。
 * 影響の大きい順に返す。
 */
export function buildCategorySongImpacts(
  category: RadarCategory,
  after: SnapshotScore[],
  period: PeriodScore[],
  songMaster: RadarSongMaster,
  validSongKeys: Set<string>,
): RadarGrowthSong[] {
  const keyOf = (s: { title: string; difficulty: string | null }) =>
    `${s.title}___${s.difficulty}`;
  const afterTotal = calculateCategoryTotalBpi(category, after, songMaster, validSongKeys);

  return period
    .filter((p) => topElementMap.get(keyOf(p)) === category)
    .map((p) => {
      const reverted = buildBeforeScores(after, [p]);
      const total = calculateCategoryTotalBpi(category, reverted, songMaster, validSongKeys);
      return {
        songId: p.songId,
        title: p.title,
        difficulty: p.difficulty,
        before: p.prevExScore == null ? null : { exScore: p.prevExScore, bpi: p.prevBpi },
        after: { exScore: p.exScore, bpi: p.bpi },
        impact: afterTotal - total,
      };
    })
    .sort((a, b) => b.impact - a.impact);
}
