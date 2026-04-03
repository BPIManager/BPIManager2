import type { RadarCategory } from "@/types/stats/radar";

export const RADAR_LABELS: Record<RadarCategory, string> = {
  NOTES: "NOTES",
  CHORD: "CHORD",
  PEAK: "PEAK",
  CHARGE: "CHARGE",
  SCRATCH: "SCRATCH",
  SOFLAN: "SOFLAN",
};

export const DIFF_COLORS: Record<string, string> = {
  ANOTHER: "bg-red-900",
  LEGGENDARIA: "bg-purple-900",
  HYPER: "bg-yellow-700",
};
