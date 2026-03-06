import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { TotalBpiHistoryChart } from ".";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistorySkeleton } from "./skeleton";

export const TotalBPIHistory = ({ userId }: { userId: string }) => {
  const { levels, diffs } = useStatsFilter();

  const { history, isLoading } = useTotalBpiHistory(userId, levels, diffs);
  if (isLoading) return <TotalBpiHistorySkeleton />;
  return <TotalBpiHistoryChart data={history} />;
};
