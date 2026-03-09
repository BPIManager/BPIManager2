import { HStack, Skeleton, VStack, Box } from "@chakra-ui/react";

export const LogNavigatorSkeleton = () => (
  <HStack
    w="full"
    bg="gray.950"
    p={2}
    borderRadius="xl"
    border="1px solid"
    borderColor="whiteAlpha.100"
    mb={6}
    justify="space-between"
  >
    <Box flex="1">
      <Skeleton
        height="40px"
        width={{ base: "60px", md: "120px" }}
        borderRadius="md"
      />
    </Box>
    <Box px={2}>
      <VStack gap={1}>
        <Skeleton height="10px" width="40px" />
        <Skeleton height="14px" width={{ base: "80px", md: "120px" }} />
      </VStack>
    </Box>
    <Box flex="1" display="flex" justifyContent="flex-end">
      <Skeleton
        height="40px"
        width={{ base: "60px", md: "120px" }}
        borderRadius="md"
      />
    </Box>
  </HStack>
);
