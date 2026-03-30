import { ChartColors } from "@/types/ui/chart";


export const RANK_COLORS: Record<string, string> = {
  F: "#4A5568",
  E: "#718096",
  D: "#A0AEC0",
  C: "#F6AD55",
  B: "#ED8936",
  A: "#48BB78",
  AA: "#4299E1",
  AAA: "#F6E05E",
  "MAX-": "#E2E8F0",
};

const RANK_ORDER: Record<string, number> = {
  F: 0,
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
  AA: 6,
  AAA: 7,
  "MAX-": 8,
};

export const getRankColorFromTheme = (
  label: string,
  _colors: ChartColors,
): string => {
  return RANK_COLORS[label] ?? "#718096";
};
