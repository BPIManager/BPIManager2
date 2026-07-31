import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export interface TotalBpiStats {
  totalBpi: number;
  estimatedRank: number;
  playedCount: number;
  totalCount: number;
  area: string | null;
  areaRank: number | null;
  totalInArea: number | null;
}

export const useTotalBpiStats = (
  userId: string | undefined,
  version: string,
  asOf?: string,
) => {
  const params = new URLSearchParams({ version });
  if (asOf) params.set("asOf", asOf);

  const url =
    userId && version
      ? `${API_PREFIX}/users/${userId}/stats/totalBpi?${params.toString()}`
      : null;

  const { data, error, isLoading } = useAuthedSWR<TotalBpiStats>(url);
  return { stats: data, isLoading, isError: error };
};

export const useActiveDates = (
  userId: string | undefined,
  version: string,
) => {
  const url =
    userId && version
      ? `${API_PREFIX}/users/${userId}/stats/activeDates?version=${version}`
      : null;

  const { data, isLoading } = useAuthedSWR<string[]>(url);
  return { dates: data ?? [], isLoading };
};
