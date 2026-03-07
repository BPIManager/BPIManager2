import { useLogs } from "@/hooks/logs/useLogsList";
import {
  Box,
  Center,
  Text,
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  TimelineRoot,
} from "@chakra-ui/react";
import { LogsCard } from "../LogsCard/ui";
import { LogsCardSkeleton } from "../LogsCard/skeleton";

interface Props {
  userId: string | undefined;
  version: string;
}

export const LogsList = ({ userId, version }: Props) => {
  const { logs, isLoading, isError } = useLogs(userId, version);

  if (isError)
    return (
      <Center h="200px">
        <Text color="red.500">読み込みに失敗しました</Text>
      </Center>
    );

  return (
    <Box p={4} maxW="800px" mx="auto">
      {(isLoading ? [...new Array(3)] : logs).map((log, i) =>
        isLoading ? <LogsCardSkeleton /> : <LogsCard log={log} />,
      )}
    </Box>
  );
};
