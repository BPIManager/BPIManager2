import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { TowerRankingResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export const useIidxTowerRanking = (params: {
  version?: string;
  period: string;
  date: string;
}) => {
  const { fbUser } = useUser();
  const { version = latestVersion, period, date } = params;

  const { data, isLoading, error } = useAuthedSWRV2<TowerRankingResponse>(
    fbUser
      ? `${API_V2_PREFIX}/users/${fbUser.uid}/ranking/tower?version=${version}&period=${period}&date=${date}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
