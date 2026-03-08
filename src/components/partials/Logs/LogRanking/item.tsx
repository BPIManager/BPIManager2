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
}: {
  item: any;
  rank: number;
  type: "growth" | "top";
  onClick: () => void;
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
  const prevBpi = isNew ? 0 : item.current.bpi - item.diff.bpi;

  const wLabel = "25px";
  const wValuePrev = "38px";
  const wValueCurr = "45px";
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
          fontWeight="black"
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
              fontWeight="black"
              color={diffColor}
              lineHeight="1"
            >
              +{isBpi ? diff.toFixed(2) : diff}
            </Text>
          </>
        ) : (
          <Box
            w={`${parseFloat(wValuePrev) + 8 + parseFloat(wValueCurr) + parseFloat(wDiff)}px`}
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
            fontWeight="black"
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
