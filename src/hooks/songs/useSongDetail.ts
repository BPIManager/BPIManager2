import useSWR from "swr";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { fetcherV2 } from "@/services/swr/fetchV2";
import type { SongListItem } from "@/types/songs/songInfo";

export const useSongDetail = (songId: number | null) => {
  const { data, isLoading, error } = useSWR<SongListItem>(
    songId !== null ? `${API_V2_PREFIX}/songs/${songId}` : null,
    fetcherV2,
    { revalidateOnFocus: false },
  );

  return { song: data ?? null, isLoading, isError: error };
};
