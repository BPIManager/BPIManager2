import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import type { TowerRankingResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export const useIidxTowerRanking = (params: {
  version?: string;
  period: string;
  date: string;
}) => {
  const { fbUser } = useUser();
  const { version = latestVersion, period, date } = params;

  const { data, isLoading, error } = useAuthedSWR<TowerRankingResponse>(
    fbUser
      ? `${API_PREFIX}/users/${fbUser.uid}/ranking/tower?version=${version}&period=${period}&date=${date}`
      : null,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
