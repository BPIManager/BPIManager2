import { useStatsData } from "@/services/swr/fetchStats";

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
  const { data, error, isLoading } = useStatsData<BpiHistoryItem[]>(
    "totalBPIhistory",
    { userId, version, levels, difficulties },
  );

  return { history: data, isLoading, isError: error };
};
