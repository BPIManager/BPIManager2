import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";

export const useMonthlyReview = (
  userId: string | undefined,
  version: string | undefined,
  month: string | undefined, // YYYY-MM
) => {
  const { fbUser } = useUser();

  const shouldFetch = userId && version && month;
  const url = shouldFetch
    ? `${API_PREFIX}/users/${userId}/stats/monthly-review?version=${version}&month=${month}`
    : null;

  const { data, isLoading, error } = useSWR<MonthlyReviewData>(
    url ? [url, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, error };
};
