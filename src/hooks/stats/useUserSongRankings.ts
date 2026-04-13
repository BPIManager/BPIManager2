import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { UserSongRankingsResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/latestVersion";

export const useUserSongRankings = (version: string = latestVersion) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<UserSongRankingsResponse>(
    fbUser
      ? [
          `${API_PREFIX}/users/${fbUser.uid}/ranking/songs?version=${version}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
