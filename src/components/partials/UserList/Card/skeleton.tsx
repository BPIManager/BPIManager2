import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";

export const UserRecommendationCardSkeleton = () => {
  return (
    <HStack
      p={{ base: 3, md: 5 }}
      bg="rgba(13, 17, 23, 0.4)"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      gap={{ base: 3, md: 6 }}
      justifyContent={"space-between"}
      align="stretch"
      minH={{ base: "140px", md: "180px" }}
    >
      <VStack align="start" flex="1" gap={{ base: 2, md: 4 }} py={1}>
        <HStack gap={3} w="full">
          <SkeletonCircle size={{ base: "10", md: "12" }} />
          <VStack align="start" gap={2} flex="1">
            <Skeleton h="14px" w="60%" />
            <Skeleton h="10px" w="40%" />
          </VStack>
        </HStack>

        <Box w="full">
          <Skeleton h="8px" w="30px" mb={2} />
          <HStack align="flex-end">
            <Skeleton h="24px" w="60px" />
            <Skeleton h="12px" w="30px" />
          </HStack>
        </Box>

        <Box w="full">
          <Skeleton h="8px" w="40px" mb={2} />
          <Skeleton h="10px" w="full" />
        </Box>
      </VStack>

      <Skeleton
        w={{ base: "100px", sm: "120px", md: "140px" }}
        h={{ base: "100px", sm: "120px", md: "140px" }}
        borderRadius="xl"
        alignSelf="center"
      />
    </HStack>
  );
};
