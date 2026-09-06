import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";

export const useMonthlyReview = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewData>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
