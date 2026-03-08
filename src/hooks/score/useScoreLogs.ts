import { useUser } from "@/contexts/users/UserContext";
import { SongHistoryResponse } from "@/types/score/log";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useScoreHistory = (userId: string | undefined, songId: number) => {
  const { fbUser } = useUser();

  const { data, error, isLoading } = useSWR<SongHistoryResponse>(
    userId && songId ? [`/api/${userId}/score/${songId}`, fbUser] : null,
    fetcher,
  );

  return {
    historyGroups: data,
    isLoading,
    isError: error,
  };
};
