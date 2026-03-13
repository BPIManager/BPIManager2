import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistoryChart } from "./";

export const BpiHistorySection = ({
  myUserId,
  rivalUserId,
  myName,
  rivalName,
}: {
  myUserId: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
}) => {
  const { levels, diffs, version } = useStatsFilter();

  const { history: myHistory, isLoading: myLoading } = useTotalBpiHistory(
    myUserId,
    levels,
    diffs,
    version,
  );
  const { history: rivalHistory, isLoading: rivalLoading } = useTotalBpiHistory(
    rivalUserId,
    levels,
    diffs,
    version,
  );

  return (
    <TotalBpiHistoryChart
      myData={myHistory}
      rivalData={rivalUserId ? rivalHistory : undefined}
      isLoading={myLoading || (!!rivalUserId && rivalLoading)}
      myName={myName}
      rivalName={rivalName}
    />
  );
};
