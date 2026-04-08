import useSWR from "swr";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import type { SongListResponse } from "@/types/songs/songInfo";

export const useSongList = (version: string) => {
  const { fbUser, user } = useUser();
  const userId = user?.userId;

  const key = version
    ? userId
      ? [`${API_PREFIX}/users/${userId}/songs?version=${version}`, fbUser]
      : `${API_PREFIX}/songs?version=${version}`
    : null;

  const { data, isLoading, error } = useSWR<SongListResponse>(
    key,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { songs: data ?? [], isLoading, isError: error };
};
