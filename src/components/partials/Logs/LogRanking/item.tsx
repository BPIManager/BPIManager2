import { HStack, VStack, Text, Center, Badge, Box } from "@chakra-ui/react";

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
  const getBadge = () => {
    if (type === "growth") {
      const diff = item.diff.bpi;
      const color =
        diff >= 10
          ? "red"
          : diff >= 5
            ? "orange"
            : diff >= 3
              ? "yellow"
              : diff >= 1
                ? "green"
                : "cyan";
      return { color, label: `+${diff.toFixed(2)}` };
    }
    const val = item.current.bpi;
    const color =
      val >= 100
        ? "pink"
        : val >= 70
          ? "yellow"
          : val >= 40
            ? "green"
            : val >= 0
              ? "blue"
              : "gray";
    return { color, label: val.toFixed(2) };
  };

  const badge = getBadge();

  return (
    <HStack
      p={4}
      bg={rank <= 3 ? "whiteAlpha.50" : "transparent"}
      justify="space-between"
      _hover={{ bg: "whiteAlpha.100", cursor: "pointer" }}
      onClick={onClick}
    >
      <HStack gap={4} flex={1}>
        <Center w="24px">
          <Text
            fontSize="lg"
            fontWeight="black"
            fontFamily="mono"
            color={
              rank === 1
                ? "yellow.400"
                : rank === 2
                  ? "gray.300"
                  : rank === 3
                    ? "orange.400"
                    : "gray.600"
            }
          >
            {rank}
          </Text>
        </Center>
        <VStack align="start" gap={0}>
          <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
            {item.title}
          </Text>
          <HStack gap={2}>
            <Badge size="xs" variant="subtle">
              {item.difficulty}
            </Badge>
            <Text fontSize="2xs" color="gray.500">
              LV{item.level}
            </Text>
            {!item.previous && (
              <Badge
                size="xs"
                colorPalette="purple"
                variant="outline"
                fontSize="8px"
                px={2}
              >
                新規
              </Badge>
            )}
          </HStack>
        </VStack>
      </HStack>
      <HStack gap={4}>
        <VStack align="end" gap={0}>
          <Text fontSize="xs" color="gray.500">
            EX
          </Text>
          <Text fontSize="md" fontWeight="black" fontFamily="mono">
            {item.current.exScore}
          </Text>
        </VStack>
        <Badge
          size="lg"
          colorPalette={badge.color}
          variant="solid"
          borderRadius="md"
          px={2}
          textAlign="center"
        >
          {badge.label}
        </Badge>
      </HStack>
    </HStack>
  );
};
