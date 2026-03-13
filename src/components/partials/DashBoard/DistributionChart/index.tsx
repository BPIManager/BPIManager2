import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { ChartData, DistributionChart } from "./ui";
import { RANK_COLORS } from "@/constants/djRankColor";
import { getBpiColor } from "@/constants/bpiColor";

type DistType = "rank" | "bpi";

export interface DistributionSectionProps {
  type: DistType;
  myUserId?: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
}

export const DistributionSection = ({
  type,
  myUserId,
  rivalUserId,
  myName = "自分",
  rivalName = "ライバル",
}: DistributionSectionProps) => {
  const { levels, diffs, version } = useStatsFilter();

  const useDistHook =
    type === "rank" ? useDjRankDistribution : useBPIDistribution;

  const { distribution: myDist, isLoading: myLoading } = useDistHook(
    myUserId,
    levels,
    diffs,
    version,
  );

  const { distribution: rivalDist, isLoading: rivalLoading } = useDistHook(
    rivalUserId,
    levels,
    diffs,
    version,
  );

  const config = {
    rank: {
      title: "DJRANK 分布",
      getColor: (label: string) => RANK_COLORS[label] || "#4A5568",
      skeletonCount: 9,
    },
    bpi: {
      title: "BPI分布",
      getColor: getBpiColor,
      skeletonCount: 13,
    },
  }[type];

  const isLoading = myLoading || (!!rivalUserId && rivalLoading);
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
  if (!hasData(myDist) && !hasData(rivalDist)) {
    return null;
  }

  return (
    <DistributionChart
      title={config.title}
      myData={myDist || []}
      rivalData={rivalUserId ? rivalDist : undefined}
      isLoading={false}
      getColor={config.getColor}
      myName={myName}
      rivalName={rivalName}
    />
  );
};
