import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
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

  const { data, isLoading, error } = useSWR<GlobalRankingResponse>(
    fbUser
      ? [
          `${API_PREFIX}/users/${fbUser.uid}/ranking/global?${params.toString()}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return { data, isLoading, isError: error };
};
