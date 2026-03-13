import { diffColors } from "@/components/partials/Table/table";
import { Avatar } from "@/components/ui/avatar";
import { NearLoseSongItem } from "@/hooks/stats/useRivalNearLose";
import { HStack, VStack, Text, Badge } from "@chakra-ui/react";

export const NearLoseRankItem = ({
  item,
  rank,
  onClick,
}: {
  item: NearLoseSongItem;
  rank: number;
  onClick: () => void;
}) => {
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
        background: "orange.400",
        zIndex: 1,
      }}
    >
      <HStack flex={1} minW={0} gap={3}>
        <Avatar
          size="sm"
          name={item.rival.userName}
          src={String(item.rival.profileImage || "")}
          borderRadius="full"
          bg="gray.600"
        />

        <VStack align="start" gap={0} minW={0}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="white"
            textOverflow={"ellipsis"}
            lineClamp={1}
          >
            {item.title}
          </Text>
          <HStack gap={1}>
            <Badge
              variant="solid"
              color="white"
              bg={diffColors[item.difficulty]}
              fontSize="9px"
              px={2}
              h="14px"
            >
              {String(item.difficulty).charAt(0).toUpperCase()}
            </Badge>
            <Text fontSize="12px" color="gray.500">
              {item.rival.userName}
            </Text>
          </HStack>
        </VStack>
      </HStack>

      <HStack gap={4} flexShrink={0} fontFamily="mono">
        <VStack align="end" gap={0}>
          <Text fontSize="12px" color="gray.200">
            My EX
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="gray.200">
            {item.exScore}
          </Text>
        </VStack>
        <VStack align="end" gap={0}>
          <Text fontSize="12px" color="orange.500" fontWeight="bold">
            あと
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="orange.300">
            {item.exDiff}点
          </Text>
        </VStack>
      </HStack>
    </HStack>
  );
};
