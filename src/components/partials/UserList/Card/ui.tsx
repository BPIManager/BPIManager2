import {
  Box,
  Text,
  HStack,
  VStack,
  Avatar,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { getBpiColorStyle } from "../../DashBoard/BPIDistribution";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import dayjs from "@/lib/dayjs";
import { RadarSectionChart } from "../../DashBoard/Radar/ui";

export const UserRecommendationCard = ({
  user,
  viewerRadar,
  viewerTotalBpi,
  currentSort = "totalBpi",
  onClick,
}: {
  user: any;
  viewerRadar: any;
  viewerTotalBpi: number;
  currentSort?: string;
  onClick: () => void;
}) => {
  const timeAgo = user.updatedAt ? dayjs(user.updatedAt).fromNow() : "-";
  const isTotalBpi = currentSort === "totalBpi";
  const displayLabel = isTotalBpi
    ? "TOTAL BPI"
    : `${currentSort.toUpperCase()} BPI`;

  const displayValue = isTotalBpi
    ? user.totalBpi
    : (user.radar[currentSort.toUpperCase()] ?? -15);

  const viewerCompareValue = isTotalBpi
    ? viewerTotalBpi
    : (viewerRadar[currentSort.toUpperCase()]?.totalBpi ?? -15);

  const bpiStyle = getBpiColorStyle(displayValue);
  const diff = displayValue - viewerCompareValue;
  const isTarget = diff > 0;
  return (
    <Box
      as="button"
      width="full"
      onClick={onClick}
      textAlign="left"
      style={{ textDecoration: "none" }}
    >
      <HStack
        p={{ base: 3, md: 5 }}
        bg="rgba(13, 17, 23, 0.8)"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        cursor="pointer"
        gap={{ base: 3, md: 6 }}
        _hover={{
          borderColor: "whiteAlpha.400",
          bg: "rgba(20, 25, 35, 0.9)",
          transform: "translateY(-2px)",
        }}
        transition="all 0.3s cubic-bezier(.4,0,.2,1)"
        justifyContent={"space-between"}
        position="relative"
        overflow="hidden"
        align="stretch"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          w="4px"
          h="full"
          bg={getBpiColorStyle(user.totalBpi).bg}
          opacity={0.8}
        />

        <VStack align="start" flex="1" gap={{ base: 2, md: 4 }} minW={0} py={1}>
          <HStack gap={{ base: 2, md: 3 }} w="full">
            <Avatar.Root
              size={{ base: "sm", md: "lg" }}
              border="2px solid"
              borderColor="whiteAlpha.200"
            >
              <Avatar.Fallback name={user.userName} />
              <Avatar.Image src={user.profileImage ?? ""} />
            </Avatar.Root>
            <VStack align="start" gap={0} minW={0}>
              <Text
                fontWeight="bold"
                color="white"
                fontSize={{ base: "xs", md: "md" }}
                lineClamp={1}
                letterSpacing="tight"
              >
                {user.userName}
              </Text>
              <HStack>
                <Badge
                  colorPalette="orange"
                  variant="solid"
                  size="xs"
                  px={1.5}
                  borderRadius="full"
                  fontSize="12px"
                >
                  {user.arenaRank || "N/A"}
                </Badge>
                <Text fontSize="12px" color="whiteAlpha.400">
                  <span>ID:</span>
                  <Text as="span">{formatIIDXId(user.iidxId)}</Text>
                </Text>
              </HStack>
              <Text
                fontSize="12px"
                color="whiteAlpha.400"
                fontWeight="normal"
                whiteSpace="nowrap"
              >
                最終更新: {timeAgo}
              </Text>
            </VStack>
          </HStack>

          <Box>
            <Text
              fontSize="9px"
              color={isTotalBpi ? "gray.500" : "blue.400"}
              fontWeight="bold"
              mb={0.5}
              letterSpacing="wider"
            >
              {displayLabel}
            </Text>
            <HStack align="flex-end" gap={1.5}>
              <Text
                color="white"
                fontFamily="mono"
                fontWeight="bold"
                fontSize={{ base: "lg", md: "2xl" }}
                lineHeight="1"
              >
                {displayValue.toFixed(2)}
              </Text>
              <HStack gap={0} pb={0.5}>
                <Icon
                  as={isTarget ? LuTrendingUp : LuTrendingDown}
                  color={isTarget ? "orange.400" : "blue.400"}
                  boxSize={2.5}
                />
                <Text
                  fontSize="10px"
                  fontWeight="bold"
                  fontFamily="mono"
                  color={isTarget ? "orange.400" : "blue.400"}
                >
                  {isTarget ? "+" : ""}
                  {diff.toFixed(2)}
                </Text>
              </HStack>
            </HStack>
          </Box>

          <Box w="full">
            <Text
              fontSize="9px"
              color="gray.500"
              fontWeight="bold"
              mb={0.5}
              letterSpacing="wider"
            >
              COMMENT
            </Text>
            <Text
              fontSize="10px"
              color="gray.400"
              lineClamp={{ base: 1, md: 2 }}
              lineHeight="1.4"
            >
              {user.profileText || "-"}
            </Text>
          </Box>
        </VStack>

        <Box
          w={{ base: "100px", sm: "120px", md: "140px" }}
          h={{ base: "100px", sm: "120px", md: "140px" }}
          bg="blackAlpha.400"
          borderRadius="xl"
          p={1}
          borderWidth="1px"
          borderColor="whiteAlpha.50"
          alignSelf="center"
        >
          <RadarSectionChart
            data={viewerRadar}
            rivalData={user.radar}
            isMini={true}
          />
        </Box>
      </HStack>
    </Box>
  );
};
