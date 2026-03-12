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

interface RivalSummaryResponse {
  results: RivalSummaryResult[];
}

export const useRivalSummary = (params: {
  userId?: string | boolean;
  levels: string[];
  difficulties: string[];
  version: string;
}) => {
  const { userId, levels, difficulties, version } = params;

  const { data, error, isLoading, mutate } = useSWR<RivalSummaryResponse>(
    userId
      ? [
          `/api/${userId}/rivals/${version}/summary`,
          levels,
          difficulties,
          version,
        ]
      : null,
    async ([url, lvls, diffs, ver]: [string, string[], string[], string]) => {
      const query = new URLSearchParams();
      lvls.forEach((l) => query.append("levels", l));
      diffs.forEach((d) => query.append("difficulties", d));

      const res = await fetch(`${url}?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  );

  return {
    results: data?.results || [],
    isLoading,
    isError: error,
    mutate,
  };
};
