import { useLogsDetail } from "@/hooks/logs/useBatchDetail";
import {
  getBpiDistribution,
  getRankDistribution,
} from "@/utils/logs/getDistribution";
import { Box, HStack, SimpleGrid, Tabs, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { DailyBatchNotice } from "../DailyBatchNotice/ui";
import { BatchSummaryCards } from "../LogSummary/ui";
import { BaseDistributionChart } from "../../DashBoard/DistributionChart";
import { LogRank } from "../LogRanking/ui";
import { BatchSongsTable } from "../LogTable/ui";
import { RANK_COLORS } from "../../DashBoard/DJRankDistribution";
import { getBpiColor } from "../../DashBoard/BPIDistribution";
import { LogNavigator } from "../LogsNav/ui";
import { BatchTotalBpiCard } from "../TotalBPI/ui";
import { LogsDetailContentSkeleton } from "./skeleton";
import { LogErrorState } from "./error";
import { LogsDetailViewProps } from "./ui";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useShareResult } from "@/hooks/share/useShare";
import { ShareResultModal } from "../../Modal/Share/ui";
import { BpiCalculator } from "@/lib/bpi";

export const LogsDetailContent = ({
  userId,
  version,
  batchId,
  date,
  type,
}: LogsDetailViewProps) => {
  const router = useRouter();
  const {
    details,
    summary,
    isLoading: isl,
    isError,
    mutate,
  } = useLogsDetail(userId, version, { batchId, date });
  const isLoading = isl || (!details && !isError);

  let summaryRef = useRef<HTMLDivElement>(null);
  let rankRef = useRef<HTMLDivElement>(null);
  let listRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { share, isSharing } = useShareResult();

  const activeTab =
    router.query.levels || router.query.difficulties ? "songs" : "summary";

  const handleTabChange = (details: { value: string }) => {
    const nextTab = details.value;
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

  const prevBpi = details.pagination.prev?.totalBpi ?? -15;
  const currentBpi = details.pagination.current?.totalBpi ?? -15;
  const bpiDiff = currentBpi - prevBpi;
  const currentRank = BpiCalculator.estimateRank(currentBpi);
  const bpiData = getBpiDistribution(details.songs);
  const rankData = getRankDistribution(details.songs);

  return (
    <VStack align="stretch" gap={6} w="full">
      <LogNavigator
        userId={userId}
        version={version}
        pagination={details.pagination}
        type={type}
        date={date}
      />

      {type === "batch" && details.pagination.dailyBatchIds && (
        <DailyBatchNotice
          dailyBatchIds={details.pagination.dailyBatchIds}
          currentBatchId={batchId as string}
          createdAt={details.pagination.current.createdAt}
          version={version as string}
        />
      )}
      <ShareResultModal
        handleTabChange={handleTabChange}
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

      <Tabs.Root
        value={activeTab}
        onValueChange={handleTabChange}
        variant="enclosed"
        colorPalette="blue"
      >
        <HStack w="full" gap={4} align="center" mb={4} justify="space-between">
          <Tabs.List flex="1" minW="0" p={1} borderRadius="md" display="flex">
            <Tabs.Trigger value="summary" px={4} flex="1" whiteSpace="nowrap">
              サマリー
            </Tabs.Trigger>
            <Tabs.Trigger value="songs" px={4} flex="1" whiteSpace="nowrap">
              更新楽曲 ({details.songs.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Box flexShrink={0} ml={4} display="flex" justifyContent="flex-end">
            <Button
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.200"
              borderRadius="full"
              _hover={{ bg: "whiteAlpha.100" }}
              fontSize="xs"
              px={4}
              onClick={() => setIsModalOpen(true)}
            >
              <XIcon style={{ width: "20px" }} />
              共有
            </Button>
          </Box>
        </HStack>

        <Tabs.Content value="summary" py={6}>
          <Box ref={summaryRef} p={isModalOpen ? 4 : 0}>
            <BatchTotalBpiCard pagination={details.pagination} />
            {summary && (
              <BatchSummaryCards isSharing={isModalOpen} summary={summary} />
            )}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mt={4}>
              <BaseDistributionChart
                title="BPI分布"
                data={bpiData}
                isLoading={isLoading}
                getColor={getBpiColor}
                isRotated
              />
              <BaseDistributionChart
                title="ランク分布"
                data={rankData}
                isLoading={isLoading}
                getColor={(l) => RANK_COLORS[l]}
              />
            </SimpleGrid>
          </Box>
          <Box ref={rankRef} p={isModalOpen ? 4 : 0}>
            <LogRank details={details.songs} type="top" />
            <LogRank
              isSharing={isModalOpen}
              details={details.songs}
              type="growth"
            />
          </Box>
        </Tabs.Content>

        <Tabs.Content value="songs" p={0} mt={4}>
          <BatchSongsTable songs={details.songs} listRef={listRef} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
};
