import {
  Grid,
  VStack,
  Stack,
  SkeletonCircle,
  Skeleton,
  HStack,
  Separator,
} from "@chakra-ui/react";

export const RivalHeaderSkeleton = () => (
  <VStack align="stretch" gap={4} w="full">
    <Stack direction={{ base: "column", md: "row" }} align="center" gap={4}>
      <SkeletonCircle size="24" />
      <VStack align={{ base: "center", md: "start" }} gap={2} flex={1}>
        <Skeleton h="6" w="32" />
        <Skeleton h="3" w="24" />
        <HStack gap={2}>
          <Skeleton h="5" w="12" />
          <Skeleton h="5" w="20" />
        </HStack>
      </VStack>
      <Skeleton h="8" w={{ base: "full", md: "24" }} borderRadius="full" />
    </Stack>
    <Skeleton h="16" w="full" borderRadius="lg" />
  </VStack>
);

export const RivalBodySkeleton = () => (
  <VStack gap={6} align="stretch">
    <Separator opacity={0.1} />
    <VStack align="stretch" gap={3}>
      <Skeleton h="3" w="24" />
      <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={4}>
        <Skeleton h="32" borderRadius="xl" />
        <Skeleton h="32" borderRadius="xl" />
      </Grid>
    </VStack>
    <VStack align="stretch" gap={3}>
      <Skeleton h="3" w="32" />
      <Skeleton h={{ base: "250px", md: "300px" }} borderRadius="xl" />
    </VStack>
    <Skeleton h="12" w="full" borderRadius="xl" />
  </VStack>
);
