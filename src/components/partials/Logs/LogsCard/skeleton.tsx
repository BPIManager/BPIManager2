import {
  Card,
  HStack,
  VStack,
  Skeleton,
  SimpleGrid,
  Box,
} from "@chakra-ui/react";

export const LogsCardSkeleton = () => {
  return (
    <Card.Root bg="gray.950" borderColor="gray.900" p={4} w="full" mb={4}>
      <Card.Body p={0}>
        <HStack justify="space-between" mb={3} align="start">
          <VStack align="start" gap={2}>
            <Skeleton h="12px" w="100px" />
            <HStack gap={2}>
              <Skeleton h="24px" w="60px" />
              <Skeleton h="20px" w="100px" borderRadius="full" />
            </HStack>
          </VStack>
          <Skeleton h="32px" w="80px" borderRadius="md" />
        </HStack>

        <Skeleton h="1px" w="full" mb={3} />

        <VStack align="stretch" gap={2}>
          <Skeleton h="10px" w="80px" />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
            {[1, 2, 3, 4].map((i) => (
              <HStack key={i} bg="whiteAlpha.50" p={2} borderRadius="sm">
                <Skeleton h="12px" flex={1} />
                <Skeleton h="12px" w="30px" />
              </HStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};
