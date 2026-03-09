import { Center, Skeleton, Box } from "@chakra-ui/react";

export const PageHeaderSkeleton = () => (
  <Box bg="gray.800" height="100px">
    <Center flexDirection="column" gap={2}>
      <Skeleton height="32px" width="300px" />
      <Skeleton height="16px" width="450px" />
    </Center>
  </Box>
);
