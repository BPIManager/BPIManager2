import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { MonthlyReviewArena } from "@/types/stats/monthlyReview";

export const useMonthlyReviewArena = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM, YYYY or "all"
) => {
  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_V2_PREFIX}/users/${userId}/stats/monthly-review/arena?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<MonthlyReviewArena>(url, {
    revalidateOnFocus: false,
  });

  return { data, isLoading, error };
};
