import { useStatsData } from "@/services/swr/fetchStats";

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
  const { data, error, isLoading } = useStatsData<RankDistItem[]>(
    "singleBPIDistribution",
    { userId, version, levels, difficulties },
  );

  return { distribution: data, isLoading, isError: error };
};
