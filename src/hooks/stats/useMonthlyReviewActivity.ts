import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewActivity } from "@/types/stats/monthlyReview";

export const useMonthlyReviewActivity = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/activity?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewActivity>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
