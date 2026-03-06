import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { BpiDistributionChart } from ".";
import { DistributionChartSkeleton } from "../DistributionChart/skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const BpiDistributionSection = ({ userId }: { userId?: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const { distribution, isLoading } = useBPIDistribution(
    userId,
    levels,
    diffs,
    version,
  );
  if (isLoading) return <DistributionChartSkeleton count={13} />;
  if (distribution?.every((item) => item.count === 0)) {
    return null;
  }
  return <BpiDistributionChart data={distribution} isLoading={isLoading} />;
};
