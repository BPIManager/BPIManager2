import { useBatchDetails } from "@/hooks/logs/useBatchDetail";
import {
  Tabs,
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  SimpleGrid,
  Stat,
} from "@chakra-ui/react";
import { BatchSummaryCards } from "../LogSummary/ui";
import {
  getBpiDistribution,
  getRankDistribution,
} from "@/utils/logs/getDistribution";
import { BaseDistributionChart } from "../../DashBoard/DistributionChart";
import { getBpiColor } from "../../DashBoard/BPIDistribution";
import { RANK_COLORS } from "../../DashBoard/DJRankDistribution";
import { LogRank } from "../LogRanking/ui";
import { BatchNavigator } from "../LogsNav";
import { PageContainer, PageHeader } from "../../Header";
import dayjs from "dayjs";
import { BatchSongsTable } from "../LogTable/ui";
import { useRouter } from "next/router";

export const BatchDetailView = ({
  userId,
  version,
  batchId,
}: {
  userId: string | undefined;
  version: string | undefined;
  batchId: string | undefined;
}) => {
  const router = useRouter();
  const { details, summary, isLoading, isError } = useBatchDetails(
    userId,
    version,
    batchId,
  );

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

  if (isLoading)
    return (
      <Center h="400px">
        <Spinner />
      </Center>
    );
  if (isError || !details) return <Text color="red.500">読み込みエラー</Text>;
  const bpiData = getBpiDistribution(details.songs);
  const rankData = getRankDistribution(details.songs);

  return (
    <Box>
      <PageHeader
        title={dayjs(details.pagination.current.createdAt ?? new Date()).format(
          "M月D日HH:mmの更新",
        )}
        description=""
      />
      <PageContainer>
        {details.pagination && (
          <BatchNavigator
            userId={userId}
            version={version}
            pagination={details.pagination}
          />
        )}
        <Tabs.Root
          defaultValue="summary"
          variant="enclosed"
          colorPalette="blue"
          value={activeTab}
          onValueChange={handleTabChange}
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
            {summary && <BatchSummaryCards summary={summary} />}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mt={4}>
              <BaseDistributionChart
                title="BPI分布"
                data={bpiData}
                isLoading={isLoading}
                getColor={getBpiColor}
                isRotated={true}
              />
              <BaseDistributionChart
                title="ランク分布"
                data={rankData}
                isLoading={isLoading}
                getColor={(label) => RANK_COLORS[label] || "gray.500"}
              />
            </SimpleGrid>
            <LogRank details={details.songs} type="top" />
            <LogRank details={details.songs} type="growth" />
          </Tabs.Content>

          <Tabs.Content value="songs" p={0}>
            <BatchSongsTable songs={details.songs} />
          </Tabs.Content>
        </Tabs.Root>
      </PageContainer>
    </Box>
  );
};
