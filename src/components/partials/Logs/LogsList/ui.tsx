import { useState, useMemo } from "react";
import { useLogs } from "@/hooks/logs/useLogsList";
import { Box, Center, Text, Spinner } from "@chakra-ui/react";
import { LogsCard } from "../LogsCard/ui";
import { LogsCardSkeleton } from "../LogsCard/skeleton";
import { NoDataAlert } from "../../DashBoard/NoData";
import { CustomPagination } from "../../Pagination/ui";

interface Props {
  userId: string | undefined;
  version: string;
}

const PAGE_SIZE = 10;

export const LogsList = ({ userId, version }: Props) => {
  const [page, setPage] = useState(1);
  const { logs, isLoading, isError } = useLogs(userId, version);

  const displayLogs = useMemo(() => {
    if (!logs) return [];
    const startIndex = (page - 1) * PAGE_SIZE;
    return logs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [logs, page]);

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
    <Box position="relative" minH="50vh">
      <Box p={4} maxW="full" mx="auto" pb="80px">
        {isLoading
          ? [...new Array(3)].map((_, i) => <LogsCardSkeleton key={i} />)
          : displayLogs.map((log) => <LogsCard key={log.batchId} log={log} />)}
      </Box>

      {!isLoading && logs && logs.length > PAGE_SIZE && (
        <CustomPagination
          count={logs.length}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={(newPage) => {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          isSticky={true}
        />
      )}
    </Box>
  );
};
