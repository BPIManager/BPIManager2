import { VStack } from "@chakra-ui/react";
import { useTimeline } from "@/hooks/social/useTimeline";
import { TimelineItem } from "./Card/ui";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { TimelineHeader } from "./header";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";

interface TimelineListProps {
  mode: "all" | "played" | "overtaken";
  params: FilterParamsFrontend;
}

export const TimelineList = ({ mode, params }: TimelineListProps) => {
  const res = useTimeline(mode, params);

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
      <InfiniteScrollContainer
        items={res.timeline}
        setSize={res.setSize}
        isLoadingMore={res.isLoadingMore}
        isReachingEnd={res.isReachingEnd}
        header={<TimelineHeader />}
        emptyMessage="アクティビティが見つかりませんでした。フィルター条件を変えてみてください"
        renderItem={(entry) => <TimelineItem key={entry.logId} entry={entry} />}
        maxH="full"
      />
    </VStack>
  );
};
