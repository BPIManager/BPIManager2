import { DashCard } from "@/components/ui/dashcard";
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
    <DashCard>
      <HStack justify="space-between" mb={6}>
        <Skeleton h="16px" w="140px" />
        {hasButton && <Skeleton h="28px" w="100px" borderRadius="md" />}
      </HStack>

      <HStack align="flex-start" justify="space-between" gap={1} px={1}>
        {[...Array(count)].map((_, i) => {
          const heights = ["20%", "45%", "30%", "65%", "80%", "75%", "90%"];
          return (
            <VStack
              key={i}
              flex="1 1 0%"
              minW="0"
              maxW="60px"
              gap={0}
              align="stretch"
              h="180px"
            >
              <Box h="150px" position="relative" w="full">
                <VStack
                  position="absolute"
                  bottom="25px"
                  left="0"
                  right="0"
                  h="100px"
                  justify="flex-end"
                  align="center"
                  px={1}
                >
                  <Skeleton h="10px" w="80%" mb={1} />
                  <Skeleton
                    w="full"
                    h={heights[i % heights.length]}
                    borderRadius="t-xs"
                  />
                </VStack>
              </Box>
              <Box h="1px" bg="whiteAlpha.200" w="full" />
              <Box
                h="30px"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Skeleton h="10px" w="70%" />
              </Box>
            </VStack>
          );
        })}
      </HStack>
    </DashCard>
  );
};
