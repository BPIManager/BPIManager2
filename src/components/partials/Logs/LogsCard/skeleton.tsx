import {
  Card,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
  SimpleGrid,
  Box,
  Badge,
} from "@chakra-ui/react";

export const LogsCardSkeleton = () => {
  return (
    <Card.Root bg="gray.950" borderColor="gray.900" p={4} w="full">
      <Card.Body p={0}>
        <HStack justify="space-between" mb={3}>
          <VStack align="start" gap={2}>
            <Skeleton h="12px" w="120px" />
            <Skeleton h="20px" w="80px" />
          </VStack>
          <Skeleton h="32px" w="100px" borderRadius="md" />
        </HStack>
        <VStack align="stretch" gap={2}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
            {[1, 2].map((i) => (
              <Skeleton key={i} h="32px" w="full" borderRadius="sm" />
            ))}
          </SimpleGrid>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export const LogsGroupSkeleton = () => {
  return (
    <Box position="relative">
      <HStack gap={4} mb={4} position="relative" zIndex={1}>
        <SkeletonCircle size="12px" display={{ base: "none", md: "block" }} />
        <Skeleton h="24px" w="180px" />
        <Skeleton h="20px" w="60px" borderRadius="full" />
      </HStack>

      <Box
        bg="bg.muted/50"
        p={4}
        borderRadius="lg"
        mb={4}
        ml={{ base: 0, md: 8 }}
        borderWidth="1px"
        borderColor="border/50"
      >
        <HStack justify="space-between">
          <HStack gap={8}>
            <VStack align="start" gap={2}>
              <Skeleton h="10px" w="60px" />
              <Skeleton h="20px" w="100px" />
            </VStack>
            <VStack align="start" gap={2}>
              <Skeleton h="10px" w="60px" />
              <Skeleton h="20px" w="80px" />
            </VStack>
          </HStack>
          <Skeleton
            h="32px"
            w="120px"
            display={{ base: "none", sm: "block" }}
          />
        </HStack>
      </Box>

      <VStack align="stretch" gap={3} ml={{ base: 0, md: 8 }}>
        <LogsCardSkeleton />
        <LogsCardSkeleton />
      </VStack>
    </Box>
  );
};
