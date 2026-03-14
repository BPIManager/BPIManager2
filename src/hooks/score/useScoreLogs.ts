import { useUser } from "@/contexts/users/UserContext";
import { SongHistoryResponse } from "@/types/score/log";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export const useScoreHistory = (userId: string | undefined, songId: number) => {
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR<SongHistoryResponse>(
    userId && songId
      ? [`/api/${userId}/scores/${songId}/history`, fbUser]
      : null,
    fetcher,
  );

  return {
    historyGroups: data,
    isLoading,
    isError: error,
  };
};
