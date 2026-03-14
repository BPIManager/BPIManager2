import { API_PREFIX } from "@/constants/apiEndpoints";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export interface RankDistItem {
  label: string;
  count: number;
}

export const useBPIDistribution = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const params = new URLSearchParams();
  params.append("version", version);
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));
  const { fbUser } = useUser();

  const shouldFetch = userId && (levels.length > 0 || difficulties.length > 0);
  const url = shouldFetch
    ? [
        `${API_PREFIX}/users/${userId}/stats/singleBPIDistribution?${params.toString()}`,
        fbUser,
      ]
    : null;

  const { data, error, isLoading } = useSWR<RankDistItem[]>(url, fetcher);

  return {
    distribution: data,
    isLoading,
    isError: error,
  };
};
