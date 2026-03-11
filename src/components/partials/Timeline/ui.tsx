import { VStack, Box, Spinner, Center, Button, Text } from "@chakra-ui/react";
import { useTimeline } from "@/hooks/social/useTimeline";
import { TimelineItem } from "./Card/ui";
import { FilterParamsFrontend } from "@/types/songs/withScore";

interface TimelineListProps {
  mode: "all" | "played" | "overtaken";
  params: FilterParamsFrontend;
}

export const TimelineList = ({ mode, params }: TimelineListProps) => {
  const { timeline, size, setSize, isLoading, isReachingEnd } = useTimeline(
    mode,
    params,
  );

  return (
    <VStack
      align="stretch"
      gap={0}
      w="full"
      bg="blackAlpha.300"
      borderRadius="xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      {timeline.map((entry) => (
        <TimelineItem key={entry.logId} entry={entry} />
      ))}

      {isLoading && (
        <Center py={8}>
          <Spinner size="sm" color="blue.500" />
        </Center>
      )}

      {!isLoading && timeline.length === 0 && (
        <Center py={10} flexDirection="column" gap={2}>
          <Text color="gray.500" fontSize="sm">
            アクティビティが見つかりませんでした。
          </Text>
          <Text color="gray.600" fontSize="xs">
            フィルター条件を変えてみてください
          </Text>
        </Center>
      )}

      {!isReachingEnd && !isLoading && timeline.length > 0 && (
        <Box
          p={4}
          textAlign="center"
          borderTop="1px solid"
          borderColor="whiteAlpha.50"
        >
          <Button
            variant="ghost"
            size="sm"
            color="blue.400"
            onClick={() => setSize(size + 1)}
            _hover={{ bg: "whiteAlpha.100" }}
          >
            さらに読み込む
          </Button>
        </Box>
      )}
    </VStack>
  );
};
