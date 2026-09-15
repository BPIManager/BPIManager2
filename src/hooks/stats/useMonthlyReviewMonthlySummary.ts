import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";

export interface MonthlyReviewMonthlySummary {
  months: { month: string; start: number; end: number }[];
}

/** フッターの「自分の月別のデータを確認する」導線用に、直近数か月分の総合BPI推移を取得する */
export const useMonthlyReviewMonthlySummary = (
  userId: string | undefined,
  version: string | undefined,
) => {
  const shouldFetch = userId && version;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/monthly-summary?version=${version}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewMonthlySummary>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
