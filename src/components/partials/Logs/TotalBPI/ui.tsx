import { DashCard } from "@/components/ui/dashcard";
import { BpiCalculator } from "@/lib/bpi";
import {
  Box,
  HStack,
  Icon,
  Text,
  VStack,
  Separator,
  Stack,
} from "@chakra-ui/react";
import { TrendingUp, TrendingDown, ChevronRight, Minus } from "lucide-react";

export const BatchTotalBpiCard = ({ pagination }: { pagination: any }) => {
  const prevBpi = pagination.prev?.totalBpi ?? -15;
  const currentBpi = pagination.current?.totalBpi ?? -15;
  const bpiDiff = currentBpi - prevBpi;

  const prevRank = BpiCalculator.estimateRank(prevBpi);
  const currentRank = BpiCalculator.estimateRank(currentBpi);
  const rankDiff = prevRank - currentRank;

  const BpiIcon = bpiDiff > 0 ? TrendingUp : bpiDiff < 0 ? TrendingDown : Minus;
  const bpiColor =
    bpiDiff > 0 ? "blue.400" : bpiDiff < 0 ? "red.400" : "gray.500";

  const RankIcon =
    rankDiff > 0 ? TrendingUp : rankDiff < 0 ? TrendingDown : Minus;
  const rankColor =
    rankDiff > 0 ? "orange.300" : rankDiff < 0 ? "gray.500" : "gray.500";
  return (
    <DashCard p={{ base: 4, md: 6 }} mb={4}>
      <Stack
        direction={{ base: "column", md: "row" }}
        gap={{ base: 4, md: 10 }}
        align={{ base: "start", md: "center" }}
      >
        <HStack spaceX={4} w={{ base: "full", md: "auto" }}>
          <Box
            p={3}
            bg={`${bpiDiff >= 0 ? "blue" : "red"}.500/10`}
            borderRadius="xl"
            color={bpiColor}
          >
            <Icon as={BpiIcon} boxSize={{ base: 6, md: 8 }} />
          </Box>
        </HStack>

        <VStack align="start" gap={1} flex={1} w="full">
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="gray.400"
            letterSpacing="widest"
          >
            総合BPI (☆12)
          </Text>
          <HStack gap={{ base: 2, md: 3 }} align="baseline" flexWrap="wrap">
            <Text
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="bold"
              color="gray.500"
              fontFamily="mono"
            >
              {prevBpi.toFixed(2)}
            </Text>
            <Icon as={ChevronRight} color="gray.800" boxSize={3} />
            <Text
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="bold"
              color="white"
              fontFamily="mono"
              lineHeight="1"
            >
              {currentBpi.toFixed(2)}
            </Text>
            <HStack
              gap={1}
              color={bpiColor}
              bg={`${bpiColor}/10`}
              px={2}
              borderRadius="full"
            >
              <Icon as={BpiIcon} boxSize={3} />
              <Text fontSize="xs" fontWeight="bold" fontFamily="mono">
                {bpiDiff >= 0 ? "+" : ""}
                {bpiDiff.toFixed(2)}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        <Separator
          orientation={{ base: "horizontal", md: "vertical" }}
          h={{ base: "1px", md: "40px" }}
          opacity={0.1}
          display={{ base: "block", md: "block" }}
        />

        <VStack align="start" gap={1} flex={1} w="full">
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="gray.400"
            letterSpacing="widest"
          >
            推定順位
          </Text>
          <HStack gap={{ base: 2, md: 3 }} align="baseline" flexWrap="wrap">
            <Text
              fontSize={{ base: "md", md: "xl" }}
              fontWeight="bold"
              color="gray.500"
              fontFamily="mono"
            >
              {prevRank.toLocaleString()}
              <Text as="span" fontSize="10px" ml={0.5}>
                位
              </Text>
            </Text>
            <Icon as={ChevronRight} color="gray.800" boxSize={3} />
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="bold"
              color="orange.200"
              fontFamily="mono"
              lineHeight="1"
            >
              {currentRank.toLocaleString()}
              <Text as="span" fontSize="xs" ml={0.5}>
                位
              </Text>
            </Text>
            {rankDiff !== 0 && (
              <HStack gap={1} color={rankColor}>
                <Icon as={RankIcon} boxSize={3} />
                <Text fontSize="xs" fontWeight="bold" fontFamily="mono">
                  {Math.abs(rankDiff)}
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </Stack>
    </DashCard>
  );
};
