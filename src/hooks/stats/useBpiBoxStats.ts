import { useStatsData } from "@/services/swr/fetchStats";
import type { BpiBoxStatsItem, StatsGroupBy } from "@/types/stats/bpiBoxStats";

export const useBpiBoxStats = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
  groupBy: StatsGroupBy,
) => {
  const { data, error, isLoading } = useStatsData<BpiBoxStatsItem[]>(
    "bpiBoxStats",
    { userId, version, levels, difficulties, groupBy },
  );

  return { stats: data, isLoading, isError: error };
};
