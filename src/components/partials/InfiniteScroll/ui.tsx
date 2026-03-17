import { Box, VStack, Center, Spinner, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/common/useInfiniteScroll";
import { useCallback } from "react";

interface InfiniteScrollContainerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  isLoadingMore: boolean;
  isReachingEnd: boolean;
  setSize: (size: number | ((size: number) => number)) => void;
  maxH?: string;
  emptyMessage?: string;
  header?: React.ReactNode;
}

export function InfiniteScrollContainer<T>({
  items,
  renderItem,
  isLoadingMore,
  isReachingEnd,
  setSize,
  maxH = "500px",
  emptyMessage = "データが見つかりませんでした",
  header,
}: InfiniteScrollContainerProps<T>) {
  const handleIntersect = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  const observerTarget = useInfiniteScroll({
    onIntersect: handleIntersect,
    isLoading: isLoadingMore,
    isReachingEnd,
  });

  return (
    <VStack align="stretch" gap={0} maxH={maxH} overflowY="auto">
      {header}
      {items.map((item, i) => renderItem(item, i))}

      <Box
        ref={observerTarget}
        py={4}
        minH="40px"
        display="flex"
        justifyContent="center"
      >
        {isLoadingMore && <Spinner size="sm" color="blue.500" />}
        {!isLoadingMore && isReachingEnd && items.length > 0 && (
          <Text fontSize="xs" color="gray.600">
            全てのデータを読み込みました
          </Text>
        )}
      </Box>

      {!isLoadingMore && items.length === 0 && (
        <Center py={10}>
          <Text color="fg.muted" fontSize="sm">
            {emptyMessage}
          </Text>
        </Center>
      )}
    </VStack>
  );
}
