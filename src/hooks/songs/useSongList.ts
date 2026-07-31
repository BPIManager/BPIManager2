import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import type { SongListResponse } from "@/types/songs/songInfo";

export const useSongList = (version: string) => {
  const { user } = useUser();
  const userId = user?.userId;

  const url = version
    ? userId
      ? `${API_PREFIX}/users/${userId}/songs?version=${version}`
      : `${API_PREFIX}/songs?version=${version}`
    : null;

  const { data, isLoading, error } = useAuthedSWR<SongListResponse>(url, {
    revalidateOnFocus: false,
  });

  return { songs: data ?? [], isLoading, isError: error };
};
