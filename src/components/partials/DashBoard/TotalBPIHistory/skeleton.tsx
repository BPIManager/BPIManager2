import { Box, Skeleton, VStack, HStack, Flex } from "@chakra-ui/react";

export const TotalBpiHistorySkeleton = () => {
  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
      h="400px"
    >
      <Skeleton h="16px" w="140px" mb={8} />

      <Flex
        h="240px"
        w="full"
        align="end"
        justify="space-between"
        mb={6}
        px={2}
      >
        {[...Array(12)].map((_, i) => (
          <VStack key={i} flex={1} gap={2}>
            <Skeleton
              h={`${Math.random() * 40 + 10}%`}
              w="4px"
              borderRadius="t-xs"
              opacity={0.3}
            />
          </VStack>
        ))}
        <Box position="absolute" top="120px" left="40px" right="40px">
          <Skeleton h="2px" w="full" opacity={0.2} />
        </Box>
      </Flex>

      <HStack justify="space-between" px={10} mb={6}>
        <Skeleton h="10px" w="40px" />
        <Skeleton h="10px" w="40px" />
        <Skeleton h="10px" w="40px" />
      </HStack>

      <Box px={2}>
        <Skeleton h="30px" w="full" borderRadius="md" />
      </Box>
    </Box>
  );
};
