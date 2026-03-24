import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useAllScoreHistory = (
  userId: string | undefined,
  songId: number | null,
) => {
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR(
    userId && songId
      ? [`${API_PREFIX}/users/${userId}/all-scores/${songId}/history`, fbUser]
      : null,
    fetcher,
  );

  return { historyGroups: data, isLoading, isError: error };
};
