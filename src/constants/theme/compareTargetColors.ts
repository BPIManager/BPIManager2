/** 比較対象（ライバル・目標等）ごとの系列色。グラフとランキングのラベルで共通に使う（最大5件） */
export const COMPARE_TARGET_COLORS = [
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
] as const;

export const compareTargetColor = (index: number): string =>
  COMPARE_TARGET_COLORS[index % COMPARE_TARGET_COLORS.length];
