import { useLogsDetail } from "@/hooks/batches/useBatchDetail";
import {
  getBpiDistribution,
  getRankDistribution,
} from "@/utils/logs/getDistribution";
import { useRouter } from "next/router";
import { DailyBatchNotice } from "../DailyBatchNotice/ui";
import { BatchSummaryCards } from "../LogSummary/ui";
import { LogRank } from "../LogRanking/ui";
import { BatchSongsTable } from "../LogTable/ui";
import { LogNavigator } from "../LogsNav/ui";
import { BatchTotalBpiCard } from "../TotalBPI/ui";
import { LogsDetailContentSkeleton } from "./skeleton";
import { LogErrorState } from "./error";
import type { LogsDetailViewProps } from "@/types/logs/detail";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useShareResult } from "@/hooks/share/useShare";
import { ShareResultModal } from "../../Modal/Share/ui";
import { BpiCalculator } from "@/lib/bpi";
import { DistributionChart } from "../../DashBoard/DistributionChart/ui";
import { RANK_COLORS } from "@/constants/djRankColor";
import { getBpiColor } from "@/constants/bpiColor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";

export const LogsDetailContent = ({
  userId,
  version,
  batchId,
  date,
  type,
  isPublicPage,
}: LogsDetailViewProps) => {
  const router = useRouter();
  const groupedBy = (router.query.groupedBy as string) || "createdAt";
  const {
    details,
    summary,
    isLoading: isl,
    isError,
    overtakenSongs,
    mutate,
  } = useLogsDetail(userId, version, { batchId, date, groupedBy });
  const isLoading = isl || (!details && !isError);

  const summaryRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { share, isSharing } = useShareResult();

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

  if (isLoading) return <LogsDetailContentSkeleton />;
  if (isError || !details)
    return <LogErrorState error={isError} onRetry={() => mutate()} />;

  const currentBpi = details.pagination.current?.totalBpi ?? -15;
  const prevBpi = details.pagination.prev?.totalBpi ?? -15;
  const bpiDiff = currentBpi - prevBpi;
  const currentRank = BpiCalculator.estimateRank(currentBpi);
  const bpiData = getBpiDistribution(details.songs);
  const rankData = getRankDistribution(details.songs);

  return (
    <div className="flex flex-col gap-6 w-full">
      <LogNavigator pagination={details.pagination} type={type} />

      {type === "batch" && details.pagination.dailyBatchIds && (
        <DailyBatchNotice
          dailyBatchIds={details.pagination.dailyBatchIds}
          currentBatchId={batchId as string}
          createdAt={details.pagination.current.createdAt}
          version={version as string}
        />
      )}

      <ShareResultModal
        handleTabChange={(d) => handleTabChange(d.value)}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        elements={{
          summary: summaryRef.current,
          ranking: rankRef.current,
          list: listRef.current,
        }}
        shareData={{
          bpi: currentBpi,
          diff: bpiDiff,
          rank: currentRank,
          updateCount: details.songs.length,
        }}
        onShare={share}
        isSharing={isSharing}
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex w-full items-center justify-between gap-4">
          <AppTabsList visual="minimal" cols={2} className="max-w-md">
            <AppTabsTrigger visual="minimal" value="summary">
              サマリー
            </AppTabsTrigger>
            <AppTabsTrigger visual="minimal" value="songs">
              更新楽曲 ({details.songs.length})
            </AppTabsTrigger>
          </AppTabsList>

          {!isPublicPage && (
            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-bpim-border bg-transparent px-4 text-xs font-bold hover:bg-bpim-overlay/50"
                onClick={() => setIsModalOpen(true)}
              >
                <XIcon className="mr-2 h-4 w-4" />
                共有
              </Button>
            </div>
          )}
        </div>

        <TabsContent
          value="summary"
          className="mt-0 py-6 focus-visible:outline-none"
        >
          <div ref={summaryRef} className={cn(isModalOpen ? "p-4" : "p-0")}>
            <BatchTotalBpiCard pagination={details.pagination} />
            {summary && (
              <BatchSummaryCards isSharing={isModalOpen} summary={summary} />
            )}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DistributionChart
                title="BPI分布"
                myData={bpiData}
                isLoading={isLoading}
                getColor={getBpiColor}
              />
              <DistributionChart
                title="ランク分布"
                myData={rankData}
                isLoading={isLoading}
                getColor={(l) => RANK_COLORS[l]}
              />
            </div>
          </div>
          <div
            ref={rankRef}
            className={cn(
              "mt-4 flex flex-col gap-4",
              isModalOpen ? "p-4" : "p-0",
            )}
          >
            <LogRank details={details.songs} type="top" />
            <LogRank
              isSharing={isModalOpen}
              details={details.songs}
              type="growth"
            />
          </div>
          {overtakenSongs && overtakenSongs.length > 0 && (
            <div className={cn("mt-4", isModalOpen ? "p-4" : "p-0")}>
              <LogRank
                isSharing={isModalOpen}
                details={details.songs}
                type="overtake"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="songs"
          className="mt-4 p-0 focus-visible:outline-none"
        >
          <BatchSongsTable songs={details.songs} listRef={listRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
