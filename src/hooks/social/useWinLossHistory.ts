import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export interface WinLossHistoryPoint {
  date: string;
  delta: number;
  cumulative: number;
}

export const useWinLossHistory = (
  viewerId: string | null,
  rivalId: string | null,
  level: 11 | 12,
  enabled: boolean,
) => {
  const { fbUser } = useUser();

  const { data, isLoading, error } = useSWR<WinLossHistoryPoint[]>(
    enabled && fbUser && viewerId && rivalId
      ? [
          `${API_PREFIX}/users/${viewerId}/rivals/${rivalId}/win-loss-history?level=${level}&version=${latestVersion}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, error };
};
