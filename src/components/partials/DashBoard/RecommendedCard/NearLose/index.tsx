import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useNearLoseInfinite } from "@/hooks/stats/useRivalNearLose";
import { Box, VStack, Center, Spinner } from "@chakra-ui/react";
import { useRef, useEffect } from "react";
import { NearLoseRankItem } from "./item";

export const NearLoseList = ({
  userId,
  onSelect,
}: {
  userId: string;
  onSelect: (item: any) => void;
}) => {
  const { version, levels, diffs } = useStatsFilter();
  const { items, setSize, size, isLoadingMore, isReachingEnd } =
    useNearLoseInfinite(userId, version, levels, diffs);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize(size + 1);
        }
      },
      { threshold: 1.0 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [setSize, size, isReachingEnd, isLoadingMore]);

  return (
    <VStack align="stretch" gap={0} maxH="500px" overflowY="auto">
      {items.map((item, i) => (
        <NearLoseRankItem
          key={`${item.songId}-${item.rival.userId}`}
          item={item}
          rank={i + 1}
          onClick={() => onSelect(item)}
        />
      ))}
      <Box ref={observerTarget} py={4}>
        {isLoadingMore && (
          <Center>
            <Spinner size="sm" />
          </Center>
        )}
      </Box>
    </VStack>
  );
};
