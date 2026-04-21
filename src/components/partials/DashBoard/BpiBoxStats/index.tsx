import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useBpiBoxStats } from "@/hooks/stats/useBpiBoxStats";
import { BpiBoxStatsChart } from "./ui";

export const BpiBoxStatsSection = ({ userId }: { userId: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const { stats, isLoading } = useBpiBoxStats(userId, levels, diffs, version);

  return <BpiBoxStatsChart data={stats} isLoading={isLoading} />;
};
