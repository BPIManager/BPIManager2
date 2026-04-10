import useSWR from "swr";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { fetcher } from "@/utils/common/fetch";
import type { SongListItem } from "@/types/songs/songInfo";

export const useSongDetail = (songId: number | null) => {
  const { data, isLoading, error } = useSWR<SongListItem>(
    songId !== null ? `${API_PREFIX}/songs/${songId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { song: data ?? null, isLoading, isError: error };
};
