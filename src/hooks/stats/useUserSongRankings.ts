import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { UserSongRankingsResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export const useUserSongRankings = (version: string = latestVersion) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useAuthedSWR<UserSongRankingsResponse>(
    fbUser
      ? `${API_PREFIX}/users/${fbUser.uid}/ranking/songs?version=${version}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
