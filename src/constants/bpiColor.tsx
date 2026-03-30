import { ChartColors } from "@/types/ui/chart";

export const getBpiColorFromTheme = (
  label: string,
  _colors: ChartColors,
): string => {
  const val = label === "100+" ? 100 : parseFloat(label);
  return getBpiColorStyle(val).bg;
};

export const getBpiColor = (label: string) => {
  const val = label === "100+" ? 100 : parseFloat(label);
  if (isNaN(val)) return "#4A5568";
  return getBpiColorStyle(val).bg;
};

const BPI_STEP_COLORS: [number, string][] = [
  [100, "#ff00ff"],
  [90, "#FC8181"],
  [80, "#F6AD55"],
  [70, "#F6E05E"],
  [60, "#68D391"],
  [50, "#48BB78"],
  [40, "#38A169"],
  [30, "#4299E1"],
  [20, "#3182CE"],
  [10, "#2C5282"],
  [0, "#63B3ED"],
];

export const getBpiColorStyle = (bpi: number) => {
  const color = "white";
  if (bpi >= 100) return { bg: "#ff00ff", color };
  if (bpi < 0) return { bg: "#718096", color };
  const entry = BPI_STEP_COLORS.find(([threshold]) => bpi >= threshold);
  return { bg: entry?.[1] ?? "#63B3ED", color };
};
