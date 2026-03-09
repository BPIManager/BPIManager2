import { useLogsDetail } from "@/hooks/logs/useBatchDetail";
import {
  getBpiDistribution,
  getRankDistribution,
} from "@/utils/logs/getDistribution";
import {
  Box,
  Center,
  HStack,
  Link,
  SimpleGrid,
  Spinner,
  Tabs,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { PageContainer, PageHeader } from "../../Header";
import { DailyBatchNotice } from "../DailyBatchNotice/ui";
import { BatchSummaryCards } from "../LogSummary/ui";
import { BaseDistributionChart } from "../../DashBoard/DistributionChart";
import { LogRank } from "../LogRanking/ui";
import { BatchSongsTable } from "../LogTable/ui";
import { RANK_COLORS } from "../../DashBoard/DJRankDistribution";
import { getBpiColor } from "../../DashBoard/BPIDistribution";
import { LogNavigator } from "../LogsNav/ui";
import { BatchTotalBpiCard } from "../TotalBPI/ui";
import { LogsDetailViewSkeleton } from "./skeleton";
import { LogErrorState } from "./error";

export interface LogsDetailViewProps {
  userId: string | undefined;
  version: string | undefined;
  batchId?: string;
  date?: string;
  type: "batch" | "daily";
}

export const LogsDetailView = ({
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

  if (isLoading) return <LogsDetailViewSkeleton />;
  if (isError || !details) {
    return <LogErrorState error={isError} onRetry={() => mutate()} />;
  }

  const bpiData = getBpiDistribution(details.songs);
  const rankData = getRankDistribution(details.songs);

  const pageTitle =
    type === "daily"
      ? dayjs(date).format("YYYY年M月D日のまとめ")
      : dayjs(details.pagination.current.createdAt).format(
          "M月D日 HH:mmの更新",
        );

  return (
    <Box>
      <PageHeader
        title={pageTitle}
        description={
          type === "daily" ? "一日の成果を統合して表示しています" : ""
        }
      />

      <PageContainer>
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

        <Tabs.Root
          value={activeTab}
          onValueChange={handleTabChange}
          variant="enclosed"
          colorPalette="blue"
        >
          <Tabs.List p={1} borderRadius="md">
            <Tabs.Trigger value="summary" px={4}>
              サマリー
            </Tabs.Trigger>
            <Tabs.Trigger value="songs" px={4}>
              更新楽曲 ({details.songs.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="summary" py={6}>
            <BatchTotalBpiCard pagination={details.pagination} />
            {summary && <BatchSummaryCards summary={{ ...summary }} />}
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
            <LogRank details={details.songs} type="top" />
            <LogRank details={details.songs} type="growth" />
          </Tabs.Content>

          <Tabs.Content value="songs" p={0} mt={4}>
            <BatchSongsTable songs={details.songs} />
          </Tabs.Content>
        </Tabs.Root>
      </PageContainer>
    </Box>
  );
};
