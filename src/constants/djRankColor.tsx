import { ChartColors } from "@/hooks/common/useChartColors";

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
  colors: ChartColors,
): string => {
  const rank = RANK_ORDER[label] ?? 0;
  const total = 8;
  const opacity = 0.15 + (rank / total) * 0.85;
  return colors.primaryRgba(opacity);
};
