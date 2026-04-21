import { useStatsData } from "@/services/swr/fetchStats";
import type { BpiBoxStatsItem } from "@/types/stats/bpiBoxStats";

export const useBpiBoxStats = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading } = useStatsData<BpiBoxStatsItem[]>(
    "bpiBoxStats",
    { userId, version, levels, difficulties },
  );

  return { stats: data, isLoading, isError: error };
};
