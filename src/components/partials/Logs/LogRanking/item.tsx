import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";
import {
  HStack,
  VStack,
  Text,
  Center,
  Badge,
  Box,
  Icon,
} from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";

export const RankItem = ({
  item,
  rank,
  type,
  onClick,
  isSharing,
}: {
  item: BatchDetailItem;
  rank: number;
  type: "growth" | "top";
  onClick: () => void;
  isSharing?: boolean;
}) => {
  const isGrowth = type === "growth";

  const getBpiStyle = () => {
    const val = isGrowth ? item.diff.bpi : item.current.bpi;
    if (isGrowth) {
      if (val >= 10) return { color: "red.400" };
      if (val >= 5) return { color: "orange.300" };
      if (val >= 3) return { color: "yellow.200" };
      if (val >= 1) return { color: "green.300" };
      return { color: "cyan.300" };
    }
    if (val >= 100) return { color: "pink.300" };
    if (val >= 70) return { color: "yellow.200" };
    if (val >= 40) return { color: "green.300" };
    if (val >= 0) return { color: "blue.300" };
    return { color: "gray.400" };
  };

  const bpiStyle = getBpiStyle();
  const isNew = !item.previous;
  const prevEx = isNew ? 0 : item.current.exScore - item.diff.exScore;
  const prevBpi = isNew ? -15 : item.current.bpi - item.diff.bpi;

  if (isSharing) {
    const fullDiff = String(item.difficulty || "").toUpperCase();

    const labelW = "30px";
    const valW = "55px";
    const diffW = "60px";

    const ShareDataRow = ({
      label,
      prev,
      current,
      diff,
      diffColor,
      isBpi = false,
    }: any) => (
      <HStack
        gap={2}
        fontFamily="mono"
        fontSize="sm"
        w="full"
        justify="space-between"
      >
        <Text w={labelW} color="gray.600" fontWeight="bold" fontSize="xs">
          {label}
        </Text>
        <Text w={valW} color="gray.400" textAlign="right">
          {isBpi ? prev.toFixed(2) : prev}
        </Text>
        <Center w="12px">
          <Icon as={ChevronRight} boxSize={3} color="gray.200" />
        </Center>
        <Text w={valW} color="white" fontWeight="bold" textAlign="right">
          {isBpi ? current.toFixed(2) : current}
        </Text>
        <Text w={diffW} color={diffColor} fontWeight="bold" textAlign="right">
          +{isBpi ? diff.toFixed(2) : diff}
        </Text>
      </HStack>
    );

    return (
      <Box
        p={4}
        bg="gray.950"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        w="full"
      >
        <VStack align="start" gap={2}>
          <HStack gap={3} w="full" align="baseline">
            <Text
              fontSize="lg"
              fontWeight="bold"
              fontFamily="mono"
              color={
                rank === 1
                  ? "yellow.400"
                  : rank === 2
                    ? "gray.400"
                    : rank === 3
                      ? "orange.400"
                      : "gray.700"
              }
            >
              {rank}
            </Text>
            <Text fontSize="md" fontWeight="bold" color="white" lineClamp={2}>
              {item.title}
            </Text>
          </HStack>

          <HStack gap={2}>
            <Text color="gray.400" fontWeight="bold" fontSize="11px">
              ☆{item.level}
            </Text>
            <Badge
              variant="solid"
              colorPalette={
                fullDiff === "LEGGENDARIA"
                  ? "red"
                  : fullDiff === "ANOTHER"
                    ? "purple"
                    : "blue"
              }
              px={2}
            >
              {fullDiff}
            </Badge>
            {isNew && (
              <Badge colorScheme="purple" variant="solid" px={1}>
                初プレイ
              </Badge>
            )}
          </HStack>

          <VStack align="start" gap={1} pt={1} w="full">
            <ShareDataRow
              label="EX"
              prev={prevEx}
              current={item.current.exScore}
              diff={item.diff.exScore}
              diffColor="blue.400"
            />
            <ShareDataRow
              label="BPI"
              prev={prevBpi}
              current={item.current.bpi}
              diff={item.diff.bpi}
              diffColor={bpiStyle.color}
              isBpi
            />
          </VStack>
        </VStack>
      </Box>
    );
  }

  const wLabel = "25px";
  const wValuePrev = "50px";
  const wValueCurr = "50px";
  const wDiff = "65px";
  const ScoreRow = ({
    label,
    prev,
    current,
    diff,
    diffColor,
    isBpi = false,
  }: any) => {
    const isTopBpi = !isGrowth && isBpi;

    return (
      <HStack
        gap={1}
        fontFamily="mono"
        align="center"
        h={isGrowth || isTopBpi ? "26px" : "20px"}
        justify="flex-end"
      >
        <Text
          w={wLabel}
          fontSize="9px"
          color="gray.600"
          fontWeight="bold"
          textAlign="left"
        >
          {label}
        </Text>

        {isGrowth ? (
          <>
            <Text
              w={wValuePrev}
              textAlign="right"
              fontSize="xs"
              color="gray.400"
            >
              {isBpi ? prev.toFixed(2) : prev}
            </Text>
            <Center w="8px">
              <Icon as={ChevronRight} boxSize={2} color="gray.800" />
            </Center>
            <Text
              w={wValueCurr}
              textAlign="right"
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
            >
              {isBpi ? current.toFixed(2) : current}
            </Text>
            <Text
              w={wDiff}
              textAlign="right"
              fontSize={isBpi ? "lg" : "md"}
              fontWeight="bold"
              color={diffColor}
              lineHeight="1"
            >
              +{isBpi ? diff.toFixed(2) : diff}
            </Text>
          </>
        ) : (
          <Box
            w={`${8 + parseFloat(wDiff)}px`}
            display="flex"
            justifyContent="flex-end"
            alignItems="baseline"
          >
            <Text
              textAlign="right"
              fontSize={isTopBpi ? "lg" : "xs"}
              fontWeight={isTopBpi ? "black" : "bold"}
              color={isTopBpi ? diffColor : "white"}
              lineHeight="1"
            >
              {isBpi ? current.toFixed(2) : current}
            </Text>
          </Box>
        )}
      </HStack>
    );
  };

  return (
    <HStack
      p={{ base: 3, md: 4 }}
      bg={rank <= 3 ? "whiteAlpha.50" : "transparent"}
      justify="space-between"
      _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
      onClick={onClick}
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      gap={2}
    >
      <HStack gap={3} flex={1} minW={0}>
        <Center w="20px" flexShrink={0}>
          <Text
            fontSize="lg"
            fontWeight="bold"
            fontFamily="mono"
            color={
              rank === 1
                ? "yellow.400"
                : rank === 2
                  ? "gray.400"
                  : rank === 3
                    ? "orange.400"
                    : "gray.700"
            }
          >
            {rank}
          </Text>
        </Center>
        <VStack align="start" gap={0} minW={0}>
          <Text fontSize="sm" fontWeight="bold" color="white" lineClamp={1}>
            {item.title}
          </Text>
          <HStack gap={1} flexWrap="wrap">
            <Badge fontSize="9px" variant="subtle" colorScheme="gray" px={1}>
              {String(item.difficulty || "")
                .slice(0, 1)
                .toUpperCase()}
            </Badge>
            <Text fontSize="10px" color="gray.600" fontWeight="bold">
              ☆{item.level}
            </Text>
            {isNew && (
              <Badge
                colorScheme="purple"
                variant="solid"
                fontSize="8px"
                px={1}
                lineHeight="1.4"
              >
                NEW
              </Badge>
            )}
          </HStack>
        </VStack>
      </HStack>

      <VStack align="end" gap={0} flexShrink={0}>
        <ScoreRow
          label="EX"
          prev={prevEx}
          current={item.current.exScore}
          diff={item.diff.exScore}
          diffColor="blue.400"
        />
        <ScoreRow
          label="BPI"
          prev={prevBpi}
          current={item.current.bpi}
          diff={item.diff.bpi}
          diffColor={bpiStyle.color}
          isBpi
        />
      </VStack>
    </HStack>
  );
};
