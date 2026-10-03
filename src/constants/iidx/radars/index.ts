/** レーダーチャートのカテゴリ・カラー定数 */
import type { RadarCategory } from "@/types/stats/radar";
import { ARENA_CLASS_COLORS } from "@/constants/iidx/arenaClassColors";

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

export const ARENA_RANK_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ARENA_CLASS_COLORS)
    .filter(([rank]) => rank.startsWith("A"))
    .map(([rank, color]) => [rank, color.text]),
);
