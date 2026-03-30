import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useTotalBpiHistory } from "@/hooks/stats/useTotalBPIHistory";
import { TotalBpiHistoryChart } from "./ui";
import { getVersionNameFromNumber } from "@/constants/versions";

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
  const { levels, diffs, version, compareVersion } = useStatsFilter();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId = rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? rivalName
    : getVersionNameFromNumber(compareVersion);

  const { history: myHistory, isLoading: myLoading } = useTotalBpiHistory(
    myUserId,
    levels,
    diffs,
    version,
  );
  const { history: rivalHistory, isLoading: rivalLoading } = useTotalBpiHistory(
    effectiveRivalUserId,
    levels,
    diffs,
    effectiveRivalVersion,
  );

  return (
    <TotalBpiHistoryChart
      myData={myHistory}
      rivalData={effectiveRivalUserId ? rivalHistory : undefined}
      isLoading={myLoading || (!!effectiveRivalUserId && rivalLoading)}
      myName={myName}
      rivalName={effectiveRivalName}
    />
  );
};
