import { ChartColors } from "@/types/ui/chart";

export const getBpiColorFromTheme = (
  label: string,
  colors: ChartColors,
): string => {
  const val = label === "100+" ? 100 : parseFloat(label);
  if (isNaN(val) || val < 0) return colors.primaryRgba(0.25);
  if (val < 40) return colors.primaryRgba(0.45);
  if (val < 70) return colors.primaryRgba(0.7);
  if (val < 100) return colors.primaryRgba(0.9);
  return colors.primaryRgba(1.0);
};

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
