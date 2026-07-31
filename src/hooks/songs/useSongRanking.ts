import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import type { SongRankingResponse } from "@/types/users/ranking";

export const useSongRanking = (songId: number | null, version: string) => {
  const { data, isLoading, error } = useAuthedSWR<SongRankingResponse>(
    songId !== null && version
      ? `${API_PREFIX}/songs/${songId}/ranking?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
