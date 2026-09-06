import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { GlobalRankingResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export const useGlobalRanking = (
  version: string = latestVersion,
  category = "totalBpi",
  filterArea?: string,
  filterArenaClass?: string,
) => {
  const { fbUser } = useUser();

  const params = new URLSearchParams({ version, category });
  if (filterArea) params.set("area", filterArea);
  if (filterArenaClass) params.set("arenaClass", filterArenaClass);

  const { data, isLoading, error } = useAuthedSWRV2<GlobalRankingResponse>(
    fbUser
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/ranking/global?${params.toString()}`
      : null,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: error };
};
