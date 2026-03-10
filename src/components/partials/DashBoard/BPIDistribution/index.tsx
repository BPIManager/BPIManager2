import { BaseDistributionChart, ChartData } from "../DistributionChart";

export const getBpiColor = (label: string) => {
  const val = label === "100+" ? 100 : parseFloat(label);
  if (isNaN(val)) return "#4A5568";

  return getBpiColorStyle(val).bg;
};

export const getBpiColorStyle = (bpi: number) => {
  let bg = "#F56565";
  let color = "white";

  if (bpi >= 100) {
    bg = "#ff00ff";
  } else if (bpi < 0) {
    bg = "#4A5568";
  } else if (bpi < 40) {
    bg = "#4299E1";
  } else if (bpi < 70) {
    bg = "#48BB78";
  } else if (bpi < 100) {
    bg = "#F6E05E";
  }

  return { bg, color };
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
