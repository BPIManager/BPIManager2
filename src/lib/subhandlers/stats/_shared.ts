import type { NextApiRequest } from "next";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";

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

export const DIFFICULTY_LABELS: Record<string, string> = {
  HYPER: "[H]",
  ANOTHER: "[A]",
  LEGGENDARIA: "[L]",
};
