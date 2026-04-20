import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { TowerRankingResponse } from "@/types/users/ranking";
import { latestVersion } from "@/constants/latestVersion";

export const useIidxTowerRanking = (params: {
  version?: string;
  period: string;
  date: string;
}) => {
  const { fbUser } = useUser();
  const { version = latestVersion, period, date } = params;

  const { data, isLoading, error } = useSWR<TowerRankingResponse>(
    fbUser
      ? [
          `${API_PREFIX}/users/${fbUser.uid}/ranking/tower?version=${version}&period=${period}&date=${date}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
