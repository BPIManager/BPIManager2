import { BaseDistributionChart, ChartData } from "../DistributionChart";

export const getBpiColor = (label: string) => {
  if (label === "100+") return "#ff00ff";
  const val = parseInt(label);
  if (val < 0) return "#4A5568";
  if (val < 40) return "#4299E1";
  if (val < 70) return "#48BB78";
  if (val < 100) return "#F6E05E";
  return "#F56565";
};

export const BpiDistributionChart = (props: {
  data?: ChartData[];
  isLoading: boolean;
}) => (
  <BaseDistributionChart
    {...props}
    title="BPI分布"
    getColor={getBpiColor}
    isRotated={true}
  />
);
