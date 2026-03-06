import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { TotalBpiHistoryChart } from ".";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistorySkeleton } from "./skeleton";

export const TotalBPIHistory = ({ userId }: { userId: string }) => {
  const { levels, diffs, version } = useStatsFilter();

  const { history, isLoading } = useTotalBpiHistory(
    userId,
    levels,
    diffs,
    version,
  );
  if (isLoading) return <TotalBpiHistorySkeleton />;
  return <TotalBpiHistoryChart data={history} />;
};
