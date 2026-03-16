import { Skeleton, Box, VStack } from "@chakra-ui/react";

export const PageHeaderSkeleton = () => (
  <Box bg="gray.800" py={8} px={4}>
    <VStack gap={2} align="center">
      <Skeleton height="32px" width="full" maxW="300px" />
      <Skeleton height="16px" width="full" maxW="min(90%, 450px)" />
    </VStack>
  </Box>
);
