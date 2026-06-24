import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export interface RivalMonthlyReviewEntry {
  userId: string;
  userName: string;
  profileImage: string | null;
  bpiStart: number;
  bpiEnd: number;
}

interface Response {
  rivals: RivalMonthlyReviewEntry[];
}

export const useRivalMonthlyReviewSummary = (params: {
  userId?: string;
  month?: string;
  version?: string;
}) => {
  const { userId, month, version } = params;
  const { fbUser } = useUser();

  const url =
    userId && month && version
      ? `${API_PREFIX}/users/${userId}/rivals/following/monthly-review-summary?month=${month}&version=${version}`
      : null;

  const { data, error, isLoading } = useSWR<Response>(
    url ? [url, fbUser] : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    rivals: data?.rivals ?? [],
    isLoading,
    isError: error,
  };
};
