import { useState } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useBpiBoxStats } from "@/hooks/stats/useBpiBoxStats";
import { BpiBoxStatsChart } from "./ui";
import { StatsGroupBy } from "@/types/stats/bpiBoxStats";

export const BpiBoxStatsSection = ({ userId }: { userId: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const [groupBy, setGroupBy] = useState<StatsGroupBy>("day");
  const { stats, isLoading } = useBpiBoxStats(
    userId,
    levels,
    diffs,
    version,
    groupBy,
  );

  return (
    <BpiBoxStatsChart
      data={stats}
      isLoading={isLoading}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
    />
  );
};
