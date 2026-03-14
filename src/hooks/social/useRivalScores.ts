import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";
import { API_PREFIX } from "@/constants/apiEndpoints";

export const useRivalScores = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && songId
      ? `${API_PREFIX}/users/${fbUser.uid}/rivals/following/scores/${songId}?version=${version || latestVersion}`
      : null,
    fetcher,
  );

  return {
    data,
    isLoading,
    error,
    mutate,
    isValidating,
  };
};
