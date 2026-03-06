import { Box, Skeleton, VStack, HStack, Flex } from "@chakra-ui/react";

interface BaseSkeletonProps {
  count?: number;
  hasButton?: boolean;
}

export const DistributionChartSkeleton = ({
  count = 9,
  hasButton = false,
}: BaseSkeletonProps) => {
  return (
    <Box
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
      h="240px"
    >
      <HStack justify="space-between" mb={8}>
        <Skeleton h="16px" w="140px" />
        {hasButton && <Skeleton h="28px" w="100px" borderRadius="md" />}
      </HStack>

      <HStack align="flex-start" justify="space-between" gap={1} px={1}>
        {[...Array(count)].map((_, i) => {
          const heights = [
            "20%",
            "45%",
            "30%",
            "65%",
            "80%",
            "75%",
            "90%",
            "55%",
            "35%",
            "50%",
            "70%",
            "40%",
            "25%",
          ];

          return (
            <VStack key={i} flex={1} gap={0} align="stretch">
              <Flex
                direction="column"
                justify="flex-end"
                align="center"
                h="120px"
              >
                <Skeleton h="10px" w="70%" mb={2} />

                <Skeleton
                  w="full"
                  h={heights[i % heights.length]}
                  borderRadius="t-xs"
                />
              </Flex>

              <Box h="1px" bg="whiteAlpha.200" w="full" />

              <Box
                h="40px"
                w="full"
                display="flex"
                flexDirection="column"
                alignItems="center"
                pt={3}
              >
                <Skeleton h="10px" w="80%" />
              </Box>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
};
