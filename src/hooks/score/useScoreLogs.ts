import { SongHistoryResponse } from "@/types/score/log";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useScoreHistory = (userId: string | undefined, songId: number) => {
  const { data, error, isLoading } = useSWR<SongHistoryResponse>(
    userId && songId ? `/api/${userId}/score/${songId}` : null,
    fetcher,
  );

  return {
    historyGroups: data,
    isLoading,
    isError: error,
  };
};
