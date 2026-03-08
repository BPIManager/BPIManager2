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
  levels.forEach((l) => params.append("level", l));
  difficulties.forEach((d) => params.append("difficulty", d));
  const { fbUser } = useUser();

  const shouldFetch = userId && (levels.length > 0 || difficulties.length > 0);
  const url = shouldFetch
    ? [
        `/api/${userId}/stats/${version}/singleBPIDistribution?${params.toString()}`,
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
