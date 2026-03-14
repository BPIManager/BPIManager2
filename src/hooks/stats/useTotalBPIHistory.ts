import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export interface BpiHistoryItem {
  date: string;
  totalBpi: number;
  count: number;
  updatedSongs: string[];
}

export const useTotalBpiHistory = (
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
    ? [`/api/${userId}/stats/totalBPIhistory?${params.toString()}`, fbUser]
    : null;

  const { data, error, isLoading } = useSWR<BpiHistoryItem[]>(url, fetcher);

  return {
    history: data,
    isLoading,
    isError: error,
  };
};
