import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/latestVersion";

export const useRivalScores = (
  songId: number | null,
  version: string | null,
) => {
  const { fbUser } = useUser();
  const { data, error, isLoading, mutate, isValidating } = useSWR(
    fbUser && songId
      ? `/api/${fbUser.uid}/rivals/${version || latestVersion}/song/${songId}`
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
