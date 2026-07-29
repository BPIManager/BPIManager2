import { useState } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useBpiBoxStats } from "@/hooks/stats/useBpiBoxStats";
import { BpiBoxStatsChart } from "./ui";
import { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import { DashCard } from "@/components/ui/dashcard";
import { FetchErrorState } from "@/components/partials/FetchErrorState";

export const BpiBoxStatsSection = ({ userId }: { userId: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const [groupBy, setGroupBy] = useState<StatsGroupBy>("day");
  const { stats, isLoading, isError } = useBpiBoxStats(
    userId,
    levels,
    diffs,
    version,
    groupBy,
  );

  if (isError) {
    return (
      <DashCard>
        <FetchErrorState error={isError} />
      </DashCard>
    );
  }

  return (
    <BpiBoxStatsChart
      data={stats}
      isLoading={isLoading}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
    />
  );
};
