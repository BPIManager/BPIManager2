import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Stack,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/chakra/avatar";
import { LuChevronRight } from "react-icons/lu";
import { OvertakenRivalInfo } from "@/types/logs/overtaken";
import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";

interface RankItemProps {
  item: BatchDetailItem;
  onClick: () => void;
}

export const OvertakeRankItem = ({ item, onClick }: RankItemProps) => {
  const { current, previous, overtaken = [] } = item;

  const scoreDiff = current.exScore - (previous?.exScore || 0);
  const hasOvertaken = overtaken.length > 0;

  if (!hasOvertaken) return null;

  const isNew = !previous;

  return (
    <Box
      w="full"
      p={4}
      cursor="pointer"
      _hover={{ bg: "whiteAlpha.50" }}
      transition="background 0.2s"
      onClick={onClick}
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="center" w="full">
          <VStack align="flex-start" gap={1} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="white" lineClamp={1}>
              {item.title}
            </Text>
            <HStack gap={2}>
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

          <HStack gap={4}>
            <HStack gap={1.5} fontSize="xs" color="gray.400">
              <Text fontWeight="medium">{previous?.exScore || 0}</Text>
              <Icon as={LuChevronRight} size="xs" />
              <Text fontWeight="black" color="white" fontSize="md">
                {current.exScore}
              </Text>
            </HStack>
            <Badge
              colorPalette="blue"
              variant="solid"
              size="md"
              borderRadius="sm"
              minW="50px"
              display={"flex"}
              justifyContent={"center"}
            >
              +{scoreDiff}
            </Badge>
          </HStack>
        </HStack>

        {hasOvertaken && (
          <VStack
            align="stretch"
            gap={2}
            pl={3}
            py={2}
            borderLeft="2px solid"
            borderColor="yellow.600/50"
            bg="yellow.950/10"
            borderRadius="xs"
          >
            <Stack gap={1}>
              {overtaken
                .sort(
                  (a, b) =>
                    a.myNewScore - a.rivalScore - (b.myNewScore - b.rivalScore),
                )
                .map((rival: OvertakenRivalInfo) => (
                  <HStack
                    key={rival.rivalUserId}
                    justify="space-between"
                    pr={2}
                  >
                    <HStack gap={2}>
                      <Avatar
                        src={rival.rivalProfileImage ?? undefined}
                        name={rival.rivalName}
                        size="xs"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                      />
                      <Text fontSize="xs" color="gray.300" fontWeight="medium">
                        {rival.rivalName}
                      </Text>
                    </HStack>

                    <HStack gap={3}>
                      <Text fontSize="xs" color="gray.500" fontWeight="mono">
                        {rival.rivalScore}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="yellow.400"
                        minW="40px"
                        textAlign="right"
                      >
                        <Text as="span" fontSize="2xs" mr={0.5}>
                          +
                        </Text>
                        {current.exScore - rival.rivalScore}
                      </Text>
                    </HStack>
                  </HStack>
                ))}
            </Stack>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};
