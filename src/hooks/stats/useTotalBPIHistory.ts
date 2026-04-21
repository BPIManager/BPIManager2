import { useStatsData } from "@/services/swr/fetchStats";
import type { BpiHistoryItem } from "@/types/stats/bpiHistory";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";

export const useTotalBpiHistory = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
  groupBy: StatsGroupBy = "day",
) => {
  const { data, error, isLoading } = useStatsData<BpiHistoryItem[]>(
    "totalBPIhistory",
    { userId, version, levels, difficulties, groupBy },
  );

  return { history: data, isLoading, isError: error };
};
