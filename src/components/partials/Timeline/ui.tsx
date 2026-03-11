import { useEffect, useRef } from "react";
import { VStack, Box, Spinner, Center, Text, Grid } from "@chakra-ui/react";
import { useTimeline } from "@/hooks/social/useTimeline";
import { TimelineItem } from "./Card/ui";
import { FilterParamsFrontend } from "@/types/songs/withScore";

interface TimelineListProps {
  mode: "all" | "played" | "overtaken";
  params: FilterParamsFrontend;
}

export const TimelineList = ({ mode, params }: TimelineListProps) => {
  const { timeline, setSize, isLoading, isReachingEnd } = useTimeline(
    mode,
    params,
  );

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || isReachingEnd || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((prevSize) => prevSize + 1);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [isReachingEnd, isLoading, setSize]);

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
      <Grid
        templateColumns="auto 1fr"
        gap={3}
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        bg="whiteAlpha.50"
        top="0"
        zIndex={1}
      >
        <Box w="32px" />
        <Grid templateColumns="28px 1.5fr 1fr 1fr 1.2fr" gap={1}>
          <HeaderText></HeaderText>
          <HeaderText textAlign="right">RIVAL</HeaderText>
          <HeaderText textAlign="right">GROWTH</HeaderText>
          <HeaderText textAlign="right">YOU</HeaderText>
          <HeaderText textAlign="right">DIFF</HeaderText>
        </Grid>
      </Grid>

      {timeline.map((entry) => (
        <TimelineItem key={entry.logId} entry={entry} />
      ))}

      {isLoading && (
        <Center py={10} w="full">
          <Spinner size="md" color="blue.500" />
        </Center>
      )}
      {!isReachingEnd && (
        <Box ref={observerTarget} h="20px" w="full" bg="transparent" />
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

      {isReachingEnd && timeline.length > 0 && (
        <Center py={8} borderTop="1px solid" borderColor="whiteAlpha.50">
          <Text fontSize="xs" color="whiteAlpha.400" fontWeight="bold">
            これ以上のアクティビティはありません
          </Text>
        </Center>
      )}
    </VStack>
  );
};

const HeaderText = ({ children, ...props }: any) => (
  <Text
    fontSize="9px"
    fontWeight="bold"
    color="gray.500"
    letterSpacing="wider"
    {...props}
  >
    {children}
  </Text>
);
