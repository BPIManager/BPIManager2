import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { DistributionChart } from "./ui";
import { getRankColorFromTheme } from "@/constants/theme/djRankColor";
import { getBpiColorFromTheme } from "@/constants/theme/bpiColor";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useBpiStep } from "@/hooks/common/useBpiStep";
import type { DistributionSectionProps } from "@/types/ui/distribution";
import { ChartData } from "@/types/ui/chart";
import { getVersionNameFromNumber } from "@/constants/iidx/versions";
import { useTranslation } from "@/hooks/common/useTranslation";

export const BPI_STEP_OPTIONS = [10, 5, 2, 1] as const;
export type BpiStep = (typeof BPI_STEP_OPTIONS)[number];

export const DistributionSection = ({
  type,
  myUserId,
  rivalUserId,
  myName,
  rivalName,
}: DistributionSectionProps) => {
  const { levels, diffs, version, compareVersion } = useStatsFilter();
  const { t } = useTranslation();
  const effectiveMyName = myName ?? t("dashboard.me");
  const c = useChartColors();
  const { bpiStep, handleStepFiner, handleStepCoarser } = useBpiStep();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId =
    rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? (rivalName ?? t("dashboard.rival"))
    : getVersionNameFromNumber(compareVersion);

  const isBpi = type === "bpi";

  const { distribution: myRankDist, isLoading: myRankLoading } =
    useDjRankDistribution(isBpi ? undefined : myUserId, levels, diffs, version);
  const { distribution: rivalRankDist, isLoading: rivalRankLoading } =
    useDjRankDistribution(
      isBpi ? undefined : effectiveRivalUserId,
      levels,
      diffs,
      effectiveRivalVersion,
    );

  const { distribution: myBpiDist, isLoading: myBpiLoading } =
    useBPIDistribution(
      isBpi ? myUserId : undefined,
      levels,
      diffs,
      version,
      bpiStep,
    );
  const { distribution: rivalBpiDist, isLoading: rivalBpiLoading } =
    useBPIDistribution(
      isBpi ? effectiveRivalUserId : undefined,
      levels,
      diffs,
      effectiveRivalVersion,
      bpiStep,
    );

  const myDist = isBpi ? myBpiDist : myRankDist;
  const rivalDist = isBpi ? rivalBpiDist : rivalRankDist;
  const myLoading = isBpi ? myBpiLoading : myRankLoading;
  const rivalLoading = isBpi ? rivalBpiLoading : rivalRankLoading;

  const bpiSkeletonCount = Math.floor(110 / bpiStep) + 2;

  const config = {
    rank: {
      title: t("dashboard.distribution.djRankTitle"),
      getColor: (label: string) => getRankColorFromTheme(label, c),
      skeletonCount: 9,
    },
    bpi: {
      title: t("dashboard.distribution.bpiTitle"),
      getColor: (label: string) => getBpiColorFromTheme(label, c),
      skeletonCount: bpiSkeletonCount,
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
      myName={effectiveMyName}
      rivalName={effectiveRivalName}
      step={isBpi ? bpiStep : undefined}
      onStepFiner={isBpi ? handleStepFiner : undefined}
      onStepCoarser={isBpi ? handleStepCoarser : undefined}
      canStepFiner={
        isBpi && BPI_STEP_OPTIONS.indexOf(bpiStep) < BPI_STEP_OPTIONS.length - 1
      }
      canStepCoarser={isBpi && BPI_STEP_OPTIONS.indexOf(bpiStep) > 0}
    />
  );
};
