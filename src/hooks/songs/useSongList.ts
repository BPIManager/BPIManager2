import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import type { SongListResponse } from "@/types/songs/songInfo";

export const useSongList = (version: string) => {
  const { user } = useUser();
  const userId = user?.userId;

  const url = version
    ? userId
      ? `${API_V2_PREFIX}/users/${userId}/songs?version=${version}`
      : `${API_V2_PREFIX}/songs?version=${version}`
    : null;

  const { data, isLoading, error } = useAuthedSWRV2<SongListResponse>(url, {
    revalidateOnFocus: false,
  });

  return { songs: data ?? [], isLoading, isError: error };
};
