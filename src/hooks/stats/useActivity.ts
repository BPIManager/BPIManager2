import { useStatsData } from "@/services/swr/fetchStats";

export const useActivity = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, isLoading } = useStatsData<{ date: string; count: number }[]>(
    "activity",
    { userId, version, levels, difficulties },
  );

  return { activity: data, isLoading };
};
