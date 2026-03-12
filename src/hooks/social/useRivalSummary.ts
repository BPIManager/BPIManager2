import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { useUser } from "@/contexts/users/UserContext";

interface RivalSummaryResult {
  userId: string;
  userName: string;
  profileImage: string | null;
  win: number;
  lose: number;
  draw: number;
  totalCount: number;
}

export const useRivalSummary = (params: {
  userId?: string | boolean;
  levels: string[];
  difficulties: string[];
  version: string;
}) => {
  const { userId, levels, difficulties, version } = params;
  const { fbUser } = useUser();
  const query = new URLSearchParams();
  levels.forEach((l) => query.append("levels", l));
  difficulties.forEach((d) => query.append("difficulties", d));

  const url = userId
    ? `/api/${userId}/rivals/${version}/summary?${query.toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<RivalSummaryResult[]>(
    url ? [url, fbUser] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    results: data || [],
    isLoading,
    isError: error,
    mutate,
  };
};
