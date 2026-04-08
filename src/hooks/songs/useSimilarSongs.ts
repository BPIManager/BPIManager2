import useSWR from "swr";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";
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
      ? `${API_PREFIX}/songs/${songId}/similar?version=${version}&limit=${limit}&mode=${mode}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { similar: data ?? [], isLoading, isError: error };
};
