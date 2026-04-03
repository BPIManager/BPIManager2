import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";

export interface TotalBpiStats {
  totalBpi: number;
  estimatedRank: number;
  playedCount: number;
  totalCount: number;
}

export const useTotalBpiStats = (
  userId: string | undefined,
  version: string,
  asOf?: string,
) => {
  const { fbUser } = useUser();

  const params = new URLSearchParams({ version });
  if (asOf) params.set("asOf", asOf);

  const key =
    userId && version
      ? [
          `${API_PREFIX}/users/${userId}/stats/totalBpi?${params.toString()}`,
          fbUser,
        ]
      : null;

  const { data, error, isLoading } = useSWR<TotalBpiStats>(key, fetcher);
  return { stats: data, isLoading, isError: error };
};

export const useActiveDates = (
  userId: string | undefined,
  version: string,
) => {
  const { fbUser } = useUser();

  const key =
    userId && version
      ? [
          `${API_PREFIX}/users/${userId}/stats/activeDates?version=${version}`,
          fbUser,
        ]
      : null;

  const { data, isLoading } = useSWR<string[]>(key, fetcher);
  return { dates: data ?? [], isLoading };
};
