import useSWR from "swr";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import type { SongRankingResponse } from "@/types/users/ranking";

export const useSongRanking = (songId: number | null, version: string) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<SongRankingResponse>(
    songId !== null && version
      ? [`${API_PREFIX}/songs/${songId}/ranking?version=${version}`, fbUser]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
