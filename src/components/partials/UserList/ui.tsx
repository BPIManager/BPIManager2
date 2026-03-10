import { Box, Text, HStack, VStack, Avatar, Badge } from "@chakra-ui/react";
import { getBpiColorStyle } from "../DashBoard/BPIDistribution";
import { RadarSectionChart } from "../DashBoard/Radar/mutipleChart";
import Link from "next/link";

export const UserRecommendationCard = ({
  user,
  viewerRadar,
  viewerTotalBpi,
}: {
  user: any;
  viewerRadar: any;
  viewerTotalBpi: number;
}) => {
  const bpiStyle = getBpiColorStyle(user.totalBpi);

  const diff = user.totalBpi - viewerTotalBpi;
  const isTarget = diff > 0;

  return (
    <Link href={"/user/" + user.userId} passHref>
      <HStack
        p={5}
        bg="rgba(13, 17, 23, 0.8)"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        gap={6}
        _hover={{
          borderColor: "whiteAlpha.400",
          bg: "rgba(20, 25, 35, 0.9)",
          transform: "translateY(-2px)",
        }}
        transition="all 0.3s cubic-bezier(.4,0,.2,1)"
        justifyContent={"space-between"}
        position="relative"
        overflow="hidden"
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

        <VStack align="start" flex="1" gap={4} minW={0}>
          <HStack gap={3} w="full">
            <Avatar.Root
              size="lg"
              border="2px solid"
              borderColor="whiteAlpha.200"
            >
              <Avatar.Fallback name={user.userName} />
              <Avatar.Image src={user.profileImage ?? ""} />
            </Avatar.Root>
            <VStack align="start" gap={1} minW={0}>
              <Text
                fontWeight="black"
                color="white"
                fontSize="md"
                lineClamp={1}
                letterSpacing="tight"
              >
                {user.userName}
              </Text>
              <Badge
                colorPalette="orange"
                variant="solid"
                size="sm"
                px={2}
                borderRadius="full"
                fontSize="10px"
              >
                {user.arenaRank || "NO RANK"}
              </Badge>
            </VStack>
          </HStack>

          <HStack gap={5} w="full" align="flex-end">
            <Box>
              <Text
                fontSize="9px"
                color="gray.500"
                fontWeight="black"
                mb={1}
                letterSpacing="wider"
              >
                TOTAL BPI
              </Text>
              <HStack align="flex-end" gap={2}>
                <Text
                  color="white"
                  fontFamily="mono"
                  fontWeight="bold"
                  fontSize="2xl"
                  lineHeight="1"
                >
                  {user.totalBpi.toFixed(2)}
                </Text>

                <HStack gap={0.5} pb={0.5}>
                  <Text
                    fontSize="xs"
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

            <Box w="1px" h="30px" bg="whiteAlpha.200" alignSelf="center" />

            <Box flex="1" minW={0}>
              <Text
                fontSize="9px"
                color="gray.500"
                fontWeight="black"
                mb={1}
                letterSpacing="wider"
              >
                COMMENT
              </Text>
              <Text
                fontSize="xs"
                color="gray.400"
                lineClamp={2}
                lineHeight="tall"
              >
                {(user.profileText || "").slice(0, 20) +
                  (user.profileText && user.profileText.length > 20
                    ? "..."
                    : "") || "-"}
              </Text>
            </Box>
          </HStack>
        </VStack>

        <Box
          w="130px"
          h="130px"
          bg="blackAlpha.400"
          borderRadius="xl"
          p={1}
          borderWidth="1px"
          borderColor="whiteAlpha.50"
        >
          <RadarSectionChart
            data={viewerRadar}
            rivalData={user.radar}
            isMini={true}
          />
        </Box>
      </HStack>
    </Link>
  );
};
