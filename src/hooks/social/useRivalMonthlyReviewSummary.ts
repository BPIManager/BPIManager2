import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";

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

  const url =
    userId && month && version
      ? `${API_V2_PREFIX}/users/${userId}/rivals/following/monthly-review-summary?month=${month}&version=${version}`
      : null;

  const { data, error, isLoading } = useAuthedSWRV2<Response>(url, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    rivals: data?.rivals ?? [],
    isLoading,
    isError: error,
  };
};
