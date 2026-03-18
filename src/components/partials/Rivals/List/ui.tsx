import {
  Box,
  Text,
  HStack,
  VStack,
  Avatar,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { RadarSectionChart } from "../../DashBoard/Radar/ui";
import { RivalSummaryResult } from "@/hooks/social/useRivalSummary";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { DashCard } from "@/components/ui/chakra/dashcard";

export const RivalSummaryCard = ({
  rival,
  onClick,
}: {
  rival: RivalSummaryResult;
  onClick: () => void;
}) => {
  const {
    stats,
    radar,
    viewerRadar,
    totalBpi,
    userName,
    profileImage,
    arenaRank,
    iidxId,
  } = rival;

  const winRate =
    stats.totalCount > 0 ? (stats.win / stats.totalCount) * 100 : 0;
  const loseRate =
    stats.totalCount > 0 ? (stats.lose / stats.totalCount) * 100 : 0;
  const drawRate =
    stats.totalCount > 0 ? (stats.draw / stats.totalCount) * 100 : 0;

  const bpiStyle = getBpiColorStyle(totalBpi ?? -15);

  return (
    <Box
      as="button"
      width="full"
      onClick={onClick}
      textAlign="left"
      style={{ textDecoration: "none" }}
    >
      <DashCard
        p={{ base: 3, md: 5 }}
        cursor="pointer"
        gap={{ base: 3, md: 6 }}
        _hover={{
          borderColor: "whiteAlpha.200",
          bg: "rgba(20, 25, 35, 0.9)",
          transform: "translateY(-2px)",
        }}
        transition="all 0.3s cubic-bezier(.4,0,.2,1)"
        justifyContent="space-between"
        position="relative"
        overflow="hidden"
        as={HStack}
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          w="4px"
          h="full"
          bg={bpiStyle.bg}
          opacity={0.8}
        />

        <VStack align="start" flex="1" gap={{ base: 3, md: 4 }} minW={0}>
          <HStack gap={{ base: 2, md: 3 }} w="full">
            <Avatar.Root size={{ base: "sm", md: "lg" }}>
              <Avatar.Fallback name={userName} />
              <Avatar.Image src={profileImage ?? ""} />
            </Avatar.Root>
            <VStack align="start" gap={0} minW={0}>
              <Text
                fontWeight="bold"
                color="white"
                fontSize={{ base: "sm", md: "md" }}
                lineClamp={1}
              >
                {userName}
              </Text>
              <HStack gap={2}>
                <Badge
                  colorPalette="orange"
                  variant="solid"
                  size="xs"
                  px={1.5}
                  borderRadius="full"
                >
                  {arenaRank || "N/A"}
                </Badge>
                <Text fontSize="xs" color="whiteAlpha.400" fontFamily="mono">
                  {formatIIDXId(iidxId || "")}
                </Text>
              </HStack>
            </VStack>
            <Box ml="auto" textAlign="right">
              <Text fontSize="9px" color="whiteAlpha.400" fontWeight="bold">
                TOTAL BPI
              </Text>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={bpiStyle.color}
                fontFamily="mono"
              >
                {totalBpi?.toFixed(2) ?? "-15.00"}
              </Text>
            </Box>
          </HStack>

          <VStack w="full" align="start" gap={1.5}>
            <HStack
              w="full"
              justify="space-between"
              fontSize="12px"
              fontWeight="bold"
            >
              <HStack gap={1} color="blue.400">
                <Text>WIN: {stats.win}</Text>
              </HStack>
              <Text color="whiteAlpha.600">LOSE: {stats.lose}</Text>
            </HStack>

            <Flex
              w="full"
              h="6px"
              borderRadius="full"
              overflow="hidden"
              bg="whiteAlpha.100"
            >
              <Box w={`${winRate}%`} bg="blue.500" transition="width 0.5s" />
              <Box w={`${drawRate}%`} bg="gray.500" transition="width 0.5s" />
              <Box w={`${loseRate}%`} bg="red.500" transition="width 0.5s" />
            </Flex>

            <HStack
              w="full"
              justify="space-between"
              fontSize="12px"
              color="whiteAlpha.600"
            >
              <Text>{winRate.toFixed(1)}% Win</Text>
              <Text>{stats.totalCount} Songs</Text>
            </HStack>
          </VStack>
        </VStack>

        <Box
          w={{ base: "90px", sm: "110px", md: "130px" }}
          h={{ base: "90px", sm: "110px", md: "130px" }}
          bg="blackAlpha.400"
          borderRadius="xl"
          p={1}
          borderWidth="1px"
          borderColor="whiteAlpha.50"
          alignSelf="center"
        >
          <RadarSectionChart
            data={viewerRadar}
            rivalData={radar}
            isMini={true}
          />
        </Box>
      </DashCard>
    </Box>
  );
};
