/** スコアレート(%)に応じたカラーマッピング */
import { ChartColors } from "@/types/ui/chart";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { RANK_COLORS } from "@/constants/theme/djRankColor";

export const getScoreRateColorFromTheme = (
  label: string,
  _colors: ChartColors,
): string => {
  const val = label === "100" ? 100 : parseFloat(label);
  if (isNaN(val)) return "#718096";

  let color = RANK_COLORS.F;
  for (const rank of RANK_TABLE) {
    if (val >= rank.ratio * 100) color = RANK_COLORS[rank.label];
  }
  return color;
};
