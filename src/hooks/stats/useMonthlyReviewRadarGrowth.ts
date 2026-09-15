import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewRadarGrowth } from "@/types/stats/monthlyReview";

export const useMonthlyReviewRadarGrowth = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/radar-growth?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewRadarGrowth>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
