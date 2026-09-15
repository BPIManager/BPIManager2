import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * 「今月」「今年」「全期間」等、granularityに応じた期間の言い回しを返す。
 * 各セクションの文章（「{period}のベスト日」等）で共通して使う。
 */
export function usePeriodPhrase(
  granularity: "month" | "year" | "version",
): string {
  const { t } = useTranslation();
  if (granularity === "year") return t("monthlyReview.period.thisYear");
  if (granularity === "version") return t("monthlyReview.period.allTime");
  return t("monthlyReview.period.thisMonth");
}
