import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { UserSongRankingsResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export const useUserSongRankings = (version: string = latestVersion) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useAuthedSWRV2<UserSongRankingsResponse>(
    fbUser
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/ranking/songs?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
