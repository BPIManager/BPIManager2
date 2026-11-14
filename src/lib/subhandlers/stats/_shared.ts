import type { NextApiRequest } from "next";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import type { StatsQuery } from "@/types/stats/query";
import type { IIDXVersion } from "@/types/iidx/version";
import type { ValidStep } from "@/schemas/stats/singleBPIDistribution";

export const L12_DIFFICULTIES = IIDX_DIFFICULTIES;

export function groupByOf(req: NextApiRequest): StatsGroupBy {
  return (req.query.groupBy as StatsGroupBy) || "day";
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export const BPM_BANDS = [
  { label: "200~", min: 200, max: Infinity },
  { label: "180~200", min: 180, max: 200 },
  { label: "160~180", min: 160, max: 180 },
  { label: "140~160", min: 140, max: 160 },
  { label: "120~140", min: 120, max: 140 },
  { label: "~120", min: 0, max: 120 },
] as const;

export function getBpmBand(bpm: string | null | undefined): string {
  if (!bpm) return "Soflan";
  if (bpm.includes("-")) return "Soflan";
  const n = parseInt(bpm, 10);
  if (isNaN(n)) return "Soflan";
  for (const band of BPM_BANDS) {
    if (n >= band.min && n < band.max) return band.label;
  }
  return "Soflan";
}

/** ベストスコアのバージョンが不明な譜面をまとめるラベル */
export const UNKNOWN_BEST_VERSION_LABEL = "other";

const bestVersionRank = (label: string) => {
  if (label === UNKNOWN_BEST_VERSION_LABEL) return -2;
  const n = Number(label);
  return Number.isNaN(n) ? -1 : n;
};

/**
 * 自己歴代ベストを出したバージョン（新しい順、INFINITASは数値バージョンの後ろ）ごとに譜面件数を集計する。
 * ベストEXスコアが 0 以下の譜面は除外する。
 */
export function aggregateBestVersionCounts(
  rows: {
    bestExScore: number | null;
    bestVersion: string | null;
    difficultyLevel: number | null;
    difficulty: string | null;
  }[],
  filter: { levels: (number | string)[]; difficulties: string[] },
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.bestExScore || r.bestExScore <= 0) continue;
    if (
      filter.levels.length > 0 &&
      !filter.levels.includes(r.difficultyLevel as number)
    )
      continue;
    if (
      filter.difficulties.length > 0 &&
      !filter.difficulties.includes(r.difficulty as string)
    )
      continue;
    const key = r.bestVersion || UNKNOWN_BEST_VERSION_LABEL;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => bestVersionRank(b.label) - bestVersionRank(a.label));
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  HYPER: "[H]",
  ANOTHER: "[A]",
  LEGGENDARIA: "[L]",
};

/* --- ルート別クエリ型（元 index.ts のインライン定義を集約） --- */
export type StepQuery = StatsQuery & { step: ValidStep };
export type NeighborQuery = StatsQuery & {
  limit: number;
  offset: number;
  n: number;
};
export type RecommendedQuery = StatsQuery & { limit: number; offset: number };
export type TotalBpiQuery = {
  userId: string;
  version: IIDXVersion;
  asOf?: string;
};
export type AaaQuery = {
  userId: string;
  version: IIDXVersion;
  level: number;
  customGoalRatio?: number;
  customGoalOffset?: number;
};
