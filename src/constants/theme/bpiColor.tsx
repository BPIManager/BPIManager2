/** BPI値に応じたカラーマッピングユーティリティ */
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

/** WCAG相対輝度（sRGB）。0(黒)〜1(白)。 */
const relativeLuminance = (hex: string): number => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** 背景色に対して白文字・黒文字のどちらがコントラスト比を確保できるかを選ぶ。 */
const readableTextColor = (bgHex: string): string => {
  const bgL = relativeLuminance(bgHex);
  const whiteContrast = (1 + 0.05) / (bgL + 0.05);
  const blackContrast = (bgL + 0.05) / 0.05;
  return whiteContrast >= blackContrast ? "white" : "#1a202c";
};

export const getBpiColorStyle = (bpi: number) => {
  const bg =
    bpi >= 100
      ? "#ff00ff"
      : bpi < 0
        ? "#718096"
        : (BPI_STEP_COLORS.find(([threshold]) => bpi >= threshold)?.[1] ?? "#63B3ED");
  return { bg, color: readableTextColor(bg) };
};
