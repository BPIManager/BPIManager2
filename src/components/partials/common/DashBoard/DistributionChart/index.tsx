import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useDjRankDistribution } from "@/hooks/stats/useDJRankDistribution";
import { useBPIDistribution } from "@/hooks/stats/useBPIDistribution";
import { useScoreRateDistribution } from "@/hooks/stats/useScoreRateDistribution";
import { DistributionChart } from "./ui";
import { DashCard } from "@/components/ui/dashcard";
import { FetchErrorState } from "@/components/partials/common/ErrorStates/FetchErrorState";
import { getRankColorFromTheme } from "@/constants/theme/djRankColor";
import { getBpiColorFromTheme } from "@/constants/theme/bpiColor";
import { getScoreRateColorFromTheme } from "@/constants/theme/scoreRateColor";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useBpiStep } from "@/hooks/common/useBpiStep";
import type { DistributionSectionProps } from "@/types/ui/distribution";
import { ChartData } from "@/types/ui/chart";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";

export const BPI_STEP_OPTIONS = [10, 5, 2, 1] as const;
export type BpiStep = (typeof BPI_STEP_OPTIONS)[number];

export const DistributionSection = ({
  type,
  myUserId,
  rivalUserId,
  myName,
  rivalName,
  mode,
  onModeChange,
}: DistributionSectionProps) => {
  const { levels, diffs, version, compareVersion } = useStatsFilter();
  const { t } = useTranslation();
  const effectiveMyName = myName ?? t("dashboard.me");
  const c = useChartColors();
  const { bpiStep, handleStepFiner, handleStepCoarser } = useBpiStep();
  const {
    bpiStep: scoreRateStep,
    handleStepFiner: handleScoreRateStepFiner,
    handleStepCoarser: handleScoreRateStepCoarser,
  } = useBpiStep();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId =
    rivalUserId ?? (isCompareMode ? myUserId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? (rivalName ?? t("dashboard.rival"))
    : getVersionNameFromNumber(compareVersion);

  const isBpi = type === "bpi";
  const isScoreRate = type === "scoreRate";

  const {
    distribution: myRankDist,
    isLoading: myRankLoading,
    isError: myRankError,
  } = useDjRankDistribution(
    type === "rank" ? myUserId : undefined,
    levels,
    diffs,
    version,
  );
  const { distribution: rivalRankDist, isLoading: rivalRankLoading } =
    useDjRankDistribution(
      type === "rank" ? effectiveRivalUserId : undefined,
      levels,
      diffs,
      effectiveRivalVersion,
    );

  const {
    distribution: myBpiDist,
    isLoading: myBpiLoading,
    isError: myBpiError,
  } = useBPIDistribution(
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

  const {
    distribution: myScoreRateDist,
    isLoading: myScoreRateLoading,
    isError: myScoreRateError,
  } = useScoreRateDistribution(
    isScoreRate ? myUserId : undefined,
    levels,
    diffs,
    version,
    scoreRateStep,
  );
  const { distribution: rivalScoreRateDist, isLoading: rivalScoreRateLoading } =
    useScoreRateDistribution(
      isScoreRate ? effectiveRivalUserId : undefined,
      levels,
      diffs,
      effectiveRivalVersion,
      scoreRateStep,
    );

  const myDist = isBpi ? myBpiDist : isScoreRate ? myScoreRateDist : myRankDist;
  const rivalDist = isBpi
    ? rivalBpiDist
    : isScoreRate
      ? rivalScoreRateDist
      : rivalRankDist;
  const myLoading = isBpi
    ? myBpiLoading
    : isScoreRate
      ? myScoreRateLoading
      : myRankLoading;
  const myError = isBpi
    ? myBpiError
    : isScoreRate
      ? myScoreRateError
      : myRankError;
  const rivalLoading = isBpi
    ? rivalBpiLoading
    : isScoreRate
      ? rivalScoreRateLoading
      : rivalRankLoading;

  const bpiSkeletonCount = Math.floor(110 / bpiStep) + 2;
  const scoreRateSkeletonCount = Math.floor(100 / scoreRateStep) + 1;

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
    scoreRate: {
      title: t("dashboard.distribution.scoreRateTitle"),
      getColor: (label: string) => getScoreRateColorFromTheme(label, c),
      skeletonCount: scoreRateSkeletonCount,
    },
  }[type];

  const modeProps = onModeChange
    ? { mode, onModeChange }
    : {};

  const isLoading = myLoading || (!!effectiveRivalUserId && rivalLoading);
  if (isLoading) {
    return (
      <DistributionChart
        title={config.title}
        myData={[]}
        isLoading={true}
        getColor={config.getColor}
        skeletonCount={config.skeletonCount}
        {...modeProps}
      />
    );
  }

  if (myError) {
    return (
      <DashCard>
        <FetchErrorState error={myError} />
      </DashCard>
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
      step={isBpi ? bpiStep : isScoreRate ? scoreRateStep : undefined}
      onStepFiner={
        isBpi
          ? handleStepFiner
          : isScoreRate
            ? handleScoreRateStepFiner
            : undefined
      }
      onStepCoarser={
        isBpi
          ? handleStepCoarser
          : isScoreRate
            ? handleScoreRateStepCoarser
            : undefined
      }
      canStepFiner={
        (isBpi &&
          BPI_STEP_OPTIONS.indexOf(bpiStep) < BPI_STEP_OPTIONS.length - 1) ||
        (isScoreRate &&
          BPI_STEP_OPTIONS.indexOf(scoreRateStep) < BPI_STEP_OPTIONS.length - 1)
      }
      canStepCoarser={
        (isBpi && BPI_STEP_OPTIONS.indexOf(bpiStep) > 0) ||
        (isScoreRate && BPI_STEP_OPTIONS.indexOf(scoreRateStep) > 0)
      }
      {...modeProps}
    />
  );
};
