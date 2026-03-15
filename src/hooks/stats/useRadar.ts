import { useStatsData } from "@/services/swr/fetchStats";
import { RadarCategory, RadarCategoryResult } from "@/types/stats/radar";

export type RadarResponse = Record<RadarCategory, RadarCategoryResult>;

export const useRadar = (
  userId: string | undefined,
  levels: string[],
  difficulties: string[],
  version: string,
) => {
  const { data, error, isLoading, mutate } = useStatsData<RadarResponse>(
    "radar",
    { userId, version, levels, difficulties },
    {
      requireLevels: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return { radar: data, isLoading, isError: error, mutate };
};
