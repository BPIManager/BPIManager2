import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { RankDistributionChart } from ".";
import { DistributionChartSkeleton } from "../DistributionChart/skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const RankDistributionSection = ({ userId }: { userId?: string }) => {
  const { levels, diffs } = useStatsFilter();
  const { distribution, isLoading } = useDjRankDistribution(
    userId,
    levels,
    diffs,
  );
  if (isLoading)
    return <DistributionChartSkeleton count={9} hasButton={false} />;
  return <RankDistributionChart data={distribution} isLoading={isLoading} />;
};
