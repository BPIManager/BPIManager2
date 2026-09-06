import useSWR from "swr";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import type { SimilarSongsResponse } from "@/types/songs/songInfo";
import type { AttrMode } from "@/types/songs/songList";

export const useSimilarSongs = (
  songId: number | null,
  version: string,
  limit = 10,
  mode: AttrMode = "profile",
) => {
  const { data, isLoading, error } = useSWR<SimilarSongsResponse>(
    songId !== null && version
      ? `${API_V2_PREFIX}/songs/${songId}/similar?version=${version}&limit=${limit}&mode=${mode}`
      : null,
    fetcherV2,
    { revalidateOnFocus: false },
  );

  return { similar: data ?? [], isLoading, isError: error };
};
