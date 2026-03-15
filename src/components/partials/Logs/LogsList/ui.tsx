import { useState, useMemo } from "react";
import { UpdateLog, useBatchesList } from "@/hooks/batches/useBatchesList";
import {
  Box,
  Center,
  Text,
  HStack,
  Heading,
  Badge,
  VStack,
  Button,
} from "@chakra-ui/react";
import { LogsCard } from "../LogsCard/ui";
import { LogsGroupSkeleton } from "../LogsCard/skeleton";
import { NoDataAlert } from "../../DashBoard/NoData";
import { CustomPagination } from "../../Pagination/ui";
import Link from "next/link";
import dayjs from "@/lib/dayjs";

interface Props {
  userId: string | undefined;
  version: string;
  groupedBy: string;
}
interface GroupedLog {
  date: string;
  logs: UpdateLog[];
  dayTotalUpdates: number;
  dayTotalBpiDelta: number;
}

const PAGE_SIZE = 10;

export const LogsList = ({ userId, version, groupedBy }: Props) => {
  const [page, setPage] = useState(1);
  const { logs, isLoading, isError } = useBatchesList(
    userId,
    version,
    groupedBy,
  );

  const groupedLogs = useMemo(() => {
    if (!logs) return [];

    const groups: Record<string, GroupedLog> = {};

    logs.forEach((log) => {
      const date = dayjs(log.createdAt).tz().format("YYYY-MM-DD");

      if (!groups[date]) {
        groups[date] = {
          date,
          logs: [],
          dayTotalUpdates: 0,
          dayTotalBpiDelta: 0,
        };
      }

      groups[date].logs.push(log);
      groups[date].dayTotalUpdates += log.songCount || 0;
      groups[date].dayTotalBpiDelta += log.diff || 0;
    });

    return Object.values(groups);
  }, [logs]);

  const displayGroups = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return groupedLogs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [groupedLogs, page]);

  if (isError)
    return (
      <Center h="200px">
        <Text color="red.500">読み込みに失敗しました</Text>
      </Center>
    );

  if (!isLoading && logs?.length === 0) {
    return <NoDataAlert />;
  }
  return (
    <Box position="relative" minH="50vh" pb="100px">
      <VStack align="stretch" gap={8} p={4} position="relative">
        <Box
          position="absolute"
          left="24px"
          top="40px"
          bottom="100px"
          w="2px"
          bg="border"
          display={{ base: "none", md: "block" }}
        />

        {isLoading
          ? [...new Array(3)].map((_, i) => <LogsGroupSkeleton key={i} />)
          : displayGroups.map((group) => (
              <Box key={group.date} position="relative">
                <HStack gap={4} mb={4} position="relative" zIndex={1}>
                  <Box
                    bg="blue.500"
                    boxSize="12px"
                    borderRadius="full"
                    border="4px solid"
                    borderColor="bg"
                    display={{ base: "none", md: "block" }}
                    ml="1px"
                  />
                  <Heading size="md" fontWeight="bold">
                    {group.date}
                  </Heading>
                  <Badge variant="subtle" px={2}>
                    {group.logs.length} logs
                  </Badge>
                </HStack>

                <Box
                  bg="bg.muted"
                  p={4}
                  borderRadius="lg"
                  mb={4}
                  ml={{ base: 0, md: 8 }}
                  borderWidth="1px"
                  borderColor="border"
                >
                  <HStack justify="space-between" wrap="wrap">
                    <HStack gap={6}>
                      <VStack align="start" gap={0}>
                        <Text fontSize="2xs" color="fg.muted">
                          合計更新件数
                        </Text>
                        <Text fontWeight="bold" fontSize="lg">
                          {group.dayTotalUpdates} songs
                        </Text>
                      </VStack>
                      <VStack align="start" gap={0}>
                        <Text fontSize="2xs" color="fg.muted">
                          BPI上昇幅計
                        </Text>
                        <Text
                          fontWeight="bold"
                          fontSize="lg"
                          color={
                            group.dayTotalBpiDelta >= 0
                              ? "green.400"
                              : "red.400"
                          }
                        >
                          {group.dayTotalBpiDelta >= 0 ? "+" : ""}
                          {group.dayTotalBpiDelta.toFixed(2)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Link
                      href={{
                        pathname: `/users/${userId}/logs/${version}/summary/${group.date}`,
                        query: { groupedBy },
                      }}
                      passHref
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="blue"
                        px={2}
                      >
                        詳細
                      </Button>
                    </Link>
                  </HStack>
                </Box>

                <VStack align="stretch" gap={3} ml={{ base: 0, md: 8 }}>
                  {group.logs.map((log) => (
                    <LogsCard key={log.batchId} log={log} />
                  ))}
                </VStack>
              </Box>
            ))}
      </VStack>

      {!isLoading && groupedLogs.length > PAGE_SIZE && (
        <CustomPagination
          count={groupedLogs.length}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
        />
      )}
    </Box>
  );
};
