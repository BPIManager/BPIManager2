import { useMemo } from "react";
import { useRouter } from "next/router";
import { useVersionSummary } from "@/hooks/batches/useVersionSummary";
import { BatchSongsTable } from "../LogTable/ui";
import { NoDataAlert } from "../../DashBoard/NoData";
import { LogsDetailContentSkeleton } from "../LogsDetail/skeleton";
import { LogErrorState } from "../LogsDetail/error";
import { getBpiDistribution, getRankDistribution } from "@/utils/logs/getDistribution";
import { DistributionChart } from "../../DashBoard/DistributionChart/ui";
import { RANK_COLORS } from "@/constants/theme/djRankColor";
import { getBpiColor } from "@/constants/theme/bpiColor";
import { useBpiStep } from "@/hooks/common/useBpiStep";
import { ArrowRightLeft } from "lucide-react";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { BpiCalculator } from "@/lib/bpi";
import { BatchTotalBpiCard } from "../TotalBPI/ui";
import { LogRank } from "../LogRanking/ui";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";

interface Props {
  userId: string | undefined;
  version: string | undefined;
  isPublicPage?: boolean;
}

export const VersionCompareContent = ({ userId, version }: Props) => {
  const router = useRouter();
  const { data, isLoading, isError } = useVersionSummary(userId, version);
  const { bpiStep, handleStepFiner, handleStepCoarser } = useBpiStep(5);

  const activeTab =
    router.query.levels || router.query.difficulties ? "songs" : "summary";

  const handleTabChange = (nextTab: string) => {
    const nextQuery = { ...router.query };
    if (nextTab === "songs") {
      nextQuery.levels = "11,12";
      nextQuery.difficulties = "ANOTHER,LEGGENDARIA,HYPER";
      nextQuery.page = "1";
    } else {
      const filterKeys = [
        "levels",
        "difficulties",
        "search",
        "page",
        "sortKey",
        "sortOrder",
        "bpmMin",
        "bpmMax",
        "isSofran",
        "since",
        "until",
        "versions",
        "clearStates",
      ];
      filterKeys.forEach((key) => delete nextQuery[key]);
    }
    router.push({ query: nextQuery }, undefined, { shallow: true });
  };

  const songsWithCurrent = useMemo(
    () => (data?.songs ?? []).filter((s) => s.current !== null),
    [data],
  );

  const { currentTotalBpi, prevTotalBpi } = useMemo(() => {
    const currentBpis = songsWithCurrent
      .map((s) => s.current!.bpi)
      .filter((b): b is number => typeof b === "number");
    const prevBpis = songsWithCurrent
      .filter((s) => s.previous !== null)
      .map((s) => s.previous!.bpi)
      .filter((b): b is number => typeof b === "number");
    return {
      currentTotalBpi:
        currentBpis.length > 0
          ? BpiCalculator.calculateTotalBPI(currentBpis, currentBpis.length)
          : -15,
      prevTotalBpi:
        prevBpis.length > 0
          ? BpiCalculator.calculateTotalBPI(prevBpis, prevBpis.length)
          : -15,
    };
  }, [songsWithCurrent]);

  const bpiData = useMemo(
    () => getBpiDistribution(songsWithCurrent as any, bpiStep),
    [songsWithCurrent, bpiStep],
  );
  const rankData = useMemo(
    () => getRankDistribution(songsWithCurrent as any),
    [songsWithCurrent],
  );

  if (isLoading) return <LogsDetailContentSkeleton />;
  if (isError) return <LogErrorState error={isError} onRetry={() => {}} />;

  if (!data || data.compareVersion === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <NoDataAlert />
        <p className="text-sm text-bpim-muted text-center">
          比較可能な前作データが見つかりませんでした
        </p>
      </div>
    );
  }

  const fakePagination = {
    prev: { totalBpi: prevTotalBpi },
    current: { totalBpi: currentTotalBpi },
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-3 rounded-xl border border-bpim-border bg-bpim-bg/60 p-4">
        <ArrowRightLeft className="h-5 w-5 text-bpim-primary shrink-0" />
        <div>
          <p className="text-xs text-bpim-muted font-bold uppercase tracking-wider">
            バージョン比較
          </p>
          <p className="text-sm font-bold text-bpim-text">
            {getVersionNameFromNumber(data.currentVersion)}{" "}
            <span className="text-bpim-muted font-normal">vs</span>{" "}
            {data.compareVersionLabel ??
              getVersionNameFromNumber(data.compareVersion)}
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <AppTabsList visual="minimal" cols={2} className="max-w-md">
          <AppTabsTrigger visual="minimal" value="summary">
            サマリー
          </AppTabsTrigger>
          <AppTabsTrigger visual="minimal" value="songs">
            楽曲一覧 ({songsWithCurrent.length})
          </AppTabsTrigger>
        </AppTabsList>

        <TabsContent
          value="summary"
          className="mt-0 py-6 focus-visible:outline-none"
        >
          <BatchTotalBpiCard pagination={fakePagination} />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DistributionChart
              title="BPI分布（現バージョン）"
              myData={bpiData}
              isLoading={false}
              getColor={getBpiColor}
              canStepFiner
              canStepCoarser
              onStepFiner={handleStepFiner}
              onStepCoarser={handleStepCoarser}
              step={bpiStep}
            />
            <DistributionChart
              title="ランク分布（現バージョン）"
              myData={rankData}
              isLoading={false}
              getColor={(l) => RANK_COLORS[l]}
            />
          </div>
          <LogRank details={songsWithCurrent as any} type="top" />
          <LogRank details={songsWithCurrent as any} type="growth" />
        </TabsContent>

        <TabsContent
          value="songs"
          className="mt-4 p-0 focus-visible:outline-none"
        >
          <BatchSongsTable songs={songsWithCurrent as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
