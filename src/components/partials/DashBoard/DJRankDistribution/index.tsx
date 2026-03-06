import { BaseDistributionChart, ChartData } from "../DistributionChart";

const RANK_COLORS: Record<string, string> = {
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

export const RankDistributionChart = (props: {
  data?: ChartData[];
  isLoading: boolean;
}) => (
  <BaseDistributionChart
    {...props}
    title="DJRANK 分布"
    getColor={(label) => RANK_COLORS[label] || "gray.500"}
  />
);
