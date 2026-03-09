import {
  Box,
  VStack,
  HStack,
  Skeleton,
  SimpleGrid,
  Center,
} from "@chakra-ui/react";
import { PageContainer } from "../../Header";
import { PageHeaderSkeleton } from "../../Header/skeleton";
import { LogNavigatorSkeleton } from "../LogsNav/skeleton";

export const LogsDetailViewSkeleton = () => {
  return (
    <Box>
      <PageHeaderSkeleton />
      <PageContainer>
        <LogNavigatorSkeleton />

        <VStack gap={6} align="stretch">
          <HStack gap={2} mb={4}>
            <Skeleton height="40px" width="120px" borderRadius="md" />
            <Skeleton height="40px" width="160px" borderRadius="md" />
          </HStack>

          <Skeleton height="80px" width="full" borderRadius="xl" />
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Skeleton height="100px" borderRadius="xl" />
            <Skeleton height="100px" borderRadius="xl" />
            <Skeleton height="100px" borderRadius="xl" />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <Skeleton height="300px" borderRadius="xl" />
            <Skeleton height="300px" borderRadius="xl" />
          </SimpleGrid>

          <VStack gap={4} align="stretch">
            <Skeleton height="200px" width="full" borderRadius="xl" />
            <Skeleton height="200px" width="full" borderRadius="xl" />
          </VStack>
        </VStack>
      </PageContainer>
    </Box>
  );
};
