import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { DistributionChart } from "./ui";
import { getRankColorFromTheme } from "@/constants/djRankColor";
import { getBpiColorFromTheme } from "@/constants/bpiColor";
import { useChartColors } from "@/hooks/common/useChartColors";
import type { DistributionSectionProps } from "@/types/ui/distribution";
import { ChartData } from "@/types/ui/chart";
import { getVersionNameFromNumber } from "@/constants/versions";

export const DistributionSection = ({
  type,
  myUserId,
  rivalUserId,
  myName = "自分",
  rivalName = "ライバル",
}: DistributionSectionProps) => {
  const { levels, diffs, version, compareVersion } = useStatsFilter();
  const c = useChartColors();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId = rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? rivalName
    : getVersionNameFromNumber(compareVersion);

  const useDistHook =
    type === "rank" ? useDjRankDistribution : useBPIDistribution;

  const { distribution: myDist, isLoading: myLoading } = useDistHook(
    myUserId,
    levels,
    diffs,
    version,
  );
  const { distribution: rivalDist, isLoading: rivalLoading } = useDistHook(
    effectiveRivalUserId,
    levels,
    diffs,
    effectiveRivalVersion,
  );

  const config = {
    rank: {
      title: "DJRANK 分布",
      getColor: (label: string) => getRankColorFromTheme(label, c),
      skeletonCount: 9,
    },
    bpi: {
      title: "BPI分布",
      getColor: (label: string) => getBpiColorFromTheme(label, c),
      skeletonCount: 13,
    },
  }[type];

  const isLoading = myLoading || (!!effectiveRivalUserId && rivalLoading);
  if (isLoading) {
    return (
      <DistributionChart
        title={config.title}
        myData={[]}
        isLoading={true}
        getColor={config.getColor}
        skeletonCount={config.skeletonCount}
      />
    );
  }

  const hasData = (d?: ChartData[]) => d && d.some((item) => item.count > 0);
  if (!hasData(myDist) && !hasData(rivalDist)) return null;

  return (
    <DistributionChart
      title={config.title}
      myData={myDist || []}
      rivalData={effectiveRivalUserId ? rivalDist : undefined}
      isLoading={false}
      getColor={config.getColor}
      myName={myName}
      rivalName={effectiveRivalName}
    />
  );
};
