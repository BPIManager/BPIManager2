/** レーダーチャートのカテゴリ・カラー定数 */
import type { RadarCategory } from "@/types/stats/radar";

export const ALL_RADAR_CATEGORIES: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

export const RADAR_COLORS: Record<RadarCategory, string> = {
  NOTES: "#60a5fa",
  CHORD: "#f472b6",
  PEAK: "#fb923c",
  CHARGE: "#4ade80",
  SCRATCH: "#a78bfa",
  SOFLAN: "#facc15",
};

export const ARENA_RANK_COLORS: Record<string, string> = {
  A1: "#fbbf24",
  A2: "#f59e0b",
  A3: "#fb923c",
  A4: "#f97316",
  A5: "#ef4444",
};
