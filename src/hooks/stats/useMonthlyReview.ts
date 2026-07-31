import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";

export const useMonthlyReview = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_PREFIX}/users/${userId}/stats/monthly-review?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWR<MonthlyReviewData>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
