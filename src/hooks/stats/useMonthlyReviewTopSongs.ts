import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewTopSongs } from "@/types/stats/monthlyReview";

export const useMonthlyReviewTopSongs = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/top-songs?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewTopSongs>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
