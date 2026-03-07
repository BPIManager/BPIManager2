import {
  Box,
  Stack,
  VStack,
  HStack,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";

export const ArenaAverageFilterSkeleton = () => {
  return (
    <Box
      p={4}
      bg="gray.900"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        gap={{ base: 6, md: 10 }}
        align="start"
      >
        <VStack align="start" gap={2} minW={{ base: "full", md: "240px" }}>
          <Skeleton height="14px" width="60px" borderRadius="sm" />
          <Skeleton height="32px" width="full" borderRadius="md" />
        </VStack>

        <VStack align="start" gap={2}>
          <Skeleton height="14px" width="60px" borderRadius="sm" />
          <HStack gap={8} h="32px">
            <HStack gap={2}>
              <SkeletonCircle size="16px" />
              <Skeleton height="16px" width="40px" borderRadius="sm" />
            </HStack>
            <HStack gap={2}>
              <SkeletonCircle size="16px" />
              <Skeleton height="16px" width="40px" borderRadius="sm" />
            </HStack>
          </HStack>
        </VStack>
      </Stack>
    </Box>
  );
};
