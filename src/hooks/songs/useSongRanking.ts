import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { SongRankingResponse } from "@/types/users/ranking";

export const useSongRanking = (songId: number | null, version: string) => {
  const { data, isLoading, error } = useAuthedSWRV2<SongRankingResponse>(
    songId !== null && version
      ? `${API_V2_PREFIX}/songs/${songId}/ranking?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
