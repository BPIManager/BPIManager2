import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { RankDistributionChart } from ".";
import { DistributionChartSkeleton } from "../DistributionChart/skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const RankDistributionSection = ({ userId }: { userId?: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const { distribution, isLoading } = useDjRankDistribution(
    userId,
    levels,
    diffs,
    version,
  );
  if (isLoading)
    return <DistributionChartSkeleton count={9} hasButton={false} />;
  if (distribution?.every((item) => item.count === 0)) {
    return null;
  }
  return <RankDistributionChart data={distribution} isLoading={isLoading} />;
};
