import { useState } from "react";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import TotalBpiHistoryChart from "./ui";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import { DashCard } from "@/components/ui/dashcard";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";

const BpiHistorySection = ({
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
  const { levels, diffs, version, compareVersion } = useStatsFilter();
  const [groupBy, setGroupBy] = useState<StatsGroupBy>("day");
  const [isRatchetHistoryOpen, setIsRatchetHistoryOpen] = useState(false);
  const [ratchetGroupBy, setRatchetGroupBy] = useState<StatsGroupBy>("day");

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId = rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? rivalName
    : getVersionNameFromNumber(compareVersion);

  const {
    history: myHistory,
    isLoading: myLoading,
    isError: myError,
  } = useTotalBpiHistory(myUserId, levels, diffs, version, groupBy);
  const { history: rivalHistory, isLoading: rivalLoading } = useTotalBpiHistory(
    effectiveRivalUserId,
    levels,
    diffs,
    effectiveRivalVersion,
    groupBy,
  );

  const { history: ratchetHistory, isLoading: isRatchetHistoryLoading } =
    useTotalBpiHistory(
      isRatchetHistoryOpen ? myUserId : undefined,
      levels,
      diffs,
      version,
      ratchetGroupBy,
    );

  if (myError) {
    return (
      <DashCard>
        <FetchErrorState error={myError} />
      </DashCard>
    );
  }

  return (
    <TotalBpiHistoryChart
      myData={myHistory}
      rivalData={effectiveRivalUserId ? rivalHistory : undefined}
      isLoading={myLoading || (!!effectiveRivalUserId && rivalLoading)}
      myName={myName}
      rivalName={effectiveRivalName}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
      ratchetHistory={{
        isOpen: isRatchetHistoryOpen,
        onOpenChange: setIsRatchetHistoryOpen,
        data: ratchetHistory,
        isLoading: isRatchetHistoryLoading,
        groupBy: ratchetGroupBy,
        onGroupByChange: setRatchetGroupBy,
      }}
    />
  );
};

export default BpiHistorySection;
