import { HStack, VStack, Text, Badge, Box } from "@chakra-ui/react";
import { diffColors, getLampColor } from "../../Table/table";

export const SimpleRankItem = ({
  item,
  rank,
  onClick,
}: {
  item: any;
  rank: number;
  onClick: () => void;
}) => {
  const lampColor = getLampColor(item.clearState);
  const isFullCombo = item.clearState === "FULLCOMBO CLEAR";

  return (
    <HStack
      p={3}
      pl={4}
      justify="space-between"
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      gap={3}
      position="relative"
      _hover={{ bg: "whiteAlpha.50", cursor: "pointer" }}
      onClick={onClick}
      _before={{
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",

        background: isFullCombo
          ? "linear-gradient(to bottom, #ff0000, #8b00ff)"
          : lampColor,
        zIndex: 1,
      }}
    >
      <HStack flex={1} minW={0} gap={2}>
        <Box w="14px" flexShrink={0}>
          <Text
            fontSize="10px"
            fontWeight="black"
            color="gray.600"
            fontFamily="mono"
            textAlign="center"
          >
            {rank}
          </Text>
        </Box>

        <VStack align="start" gap={0} minW={0}>
          <Text fontSize="sm" fontWeight="bold" color="white" lineClamp={1}>
            {item.title}
          </Text>
          <HStack gap={1}>
            <Badge
              variant="solid"
              bg={diffColors[item.difficulty] || "gray.800"}
              color="white"
              fontSize="9px"
              px={1}
              borderRadius="sm"
              h="14px"
              display="flex"
              alignItems="center"
            >
              {String(item.difficulty || "")
                .charAt(0)
                .toUpperCase()}
            </Badge>
            <Text fontSize="10px" color="gray.500" fontWeight="bold">
              ☆{item.difficultyLevel}
            </Text>
          </HStack>
        </VStack>
      </HStack>

      <HStack gap={4} flexShrink={0} fontFamily="mono">
        <VStack align="end" gap={0}>
          <Text fontSize="9px" color="gray.600" lineHeight="1">
            EX
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="gray.200">
            {item.current.exScore}
          </Text>
        </VStack>
        <VStack align="end" gap={0}>
          <Text fontSize="9px" color="gray.600" lineHeight="1">
            BPI
          </Text>
          <Text fontSize="sm" fontWeight="black" color="blue.300">
            {(item.current.bpi ?? -15).toFixed(2)}
          </Text>
        </VStack>
      </HStack>
    </HStack>
  );
};
