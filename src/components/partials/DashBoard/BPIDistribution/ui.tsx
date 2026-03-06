import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { BpiDistributionChart } from ".";
import { DistributionChartSkeleton } from "../DistributionChart/skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const BpiDistributionSection = ({ userId }: { userId?: string }) => {
  const { levels, diffs } = useStatsFilter();
  const { distribution, isLoading } = useBPIDistribution(userId, levels, diffs);
  if (isLoading) return <DistributionChartSkeleton count={13} />;
  return <BpiDistributionChart data={distribution} isLoading={isLoading} />;
};
