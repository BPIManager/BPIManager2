import {
  Box,
  HStack,
  VStack,
  Flex,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";

export const RivalSummarySkeleton = () => {
  return (
    <HStack
      p={{ base: 3, md: 5 }}
      bg="rgba(13, 17, 23, 0.8)"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      justifyContent="space-between"
      align="stretch"
      width="full"
      gap={{ base: 3, md: 6 }}
    >
      <VStack align="start" flex="1" gap={{ base: 3, md: 4 }} minW={0}>
        <HStack gap={{ base: 2, md: 3 }} w="full">
          <SkeletonCircle size={{ base: "10", md: "12" }} />
          <VStack align="start" gap={1.5} flex="1">
            <Skeleton h="14px" w="100px" />
            <HStack gap={2}>
              <Skeleton h="16px" w="40px" borderRadius="full" />
              <Skeleton h="12px" w="60px" />
            </HStack>
          </VStack>
          <VStack align="end" gap={1}>
            <Skeleton h="9px" w="40px" />
            <Skeleton h="24px" w="60px" />
          </VStack>
        </HStack>

        <VStack w="full" align="start" gap={2}>
          <HStack w="full" justify="space-between">
            <Skeleton h="12px" w="60px" />
            <Skeleton h="12px" w="60px" />
          </HStack>
          <Skeleton h="6px" w="full" borderRadius="full" />
          <HStack w="full" justify="space-between">
            <Skeleton h="12px" w="50px" />
            <Skeleton h="12px" w="70px" />
          </HStack>
        </VStack>
      </VStack>

      <Box
        w={{ base: "90px", sm: "110px", md: "130px" }}
        h={{ base: "90px", sm: "110px", md: "130px" }}
        bg="whiteAlpha.50"
        borderRadius="xl"
        alignSelf="center"
      >
        <Skeleton h="full" w="full" borderRadius="xl" />
      </Box>
    </HStack>
  );
};
