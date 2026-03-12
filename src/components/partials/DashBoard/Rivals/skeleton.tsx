import {
  Box,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from "@chakra-ui/react";

export const RivalWinLossSummarySkeleton = () => {
  return (
    <VStack gap={4} align="stretch">
      {[...Array(5)].map((_, i) => (
        <VStack key={i} align="stretch" gap={1}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <SkeletonCircle size="32px" />
              <Skeleton h="12px" w="100px" />
            </HStack>
            <Skeleton h="10px" w="40px" />
          </HStack>
          <Skeleton h="18px" w="full" borderRadius="sm" />
        </VStack>
      ))}
    </VStack>
  );
};
