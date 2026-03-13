import {
  Box,
  VStack,
  HStack,
  Stack,
  Text,
  Badge,
  Grid,
  GridItem,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { Swords } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatIIDXId } from "@/utils/common/formatIidxId";
import { FollowSection } from "../../Profile/Sidebar/followStatus";
import { keyframes } from "@emotion/react";
export const RivalHeader = ({ profile, isUpdating, onToggleFollow }: any) => (
  <VStack align="stretch" gap={4} w="full">
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={{ base: 4, md: 6 }}
      align={{ base: "center", md: "center" }}
      textAlign={{ base: "center", md: "left" }}
      w="full"
    >
      <Avatar
        size="2xl"
        src={profile?.profileImage}
        name={profile?.userName}
        borderRadius="full"
        border="2px solid"
        borderColor="whiteAlpha.100"
      />

      <VStack align={{ base: "center", md: "start" }} gap={1} flex={1} minW={0}>
        <HStack wrap="wrap" justify={{ base: "center", md: "flex-start" }}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="white"
            letterSpacing="tight"
          >
            {profile?.userName}
          </Text>
          {profile?.relationship?.isMutual && (
            <Badge size="xs" colorPalette="purple" variant="subtle" px={2}>
              相互フォロー
            </Badge>
          )}
        </HStack>
        <Text
          fontSize="xs"
          color="gray.500"
          fontFamily="mono"
          letterSpacing="wider"
        >
          ID: {formatIIDXId(profile?.iidxId)}
        </Text>
        <HStack mt={1} gap={2} justify={{ base: "center", md: "flex-start" }}>
          <Badge
            colorPalette="orange"
            variant="solid"
            size="sm"
            borderRadius="sm"
            px={2}
          >
            {profile?.current?.arenaRank || "N/A"}
          </Badge>
          <Badge
            colorPalette="blue"
            variant="subtle"
            size="sm"
            borderRadius="sm"
            px={2}
          >
            ☆12 BPI: {profile?.current?.totalBpi?.toFixed(2) || "N/A"}
          </Badge>
        </HStack>
      </VStack>

      <Flex w={{ base: "full", md: "auto" }} justify="center">
        <FollowSection
          onModal
          w={{ mdDown: "full", lg: "auto" }}
          userId={profile?.userId}
          isUpdating={isUpdating}
          relationship={profile?.relationship}
          onToggle={onToggleFollow}
        />
      </Flex>
    </Stack>
    {profile?.profileText && (
      <Box bg="whiteAlpha.50" p={3} borderRadius="lg" w="full">
        <Text fontSize="xs" color="gray.300" whiteSpace="pre-wrap">
          {profile?.profileText}
        </Text>
      </Box>
    )}
  </VStack>
);

const extendBounce = keyframes`
  0% { transform: scaleX(0); }
  60% { transform: scaleX(1.05); }
  80% { transform: scaleX(0.98); }
  100% { transform: scaleX(1); }
`;

export const WinLossStats = ({ winLossData }: { winLossData: any[] }) => (
  <VStack align="stretch" gap={3}>
    <SectionTitle icon={Swords} label="WIN / LOSS STATS" />
    <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={4}>
      {[11, 12].map((lv) => {
        const stats = winLossData.find((s) => s.level === lv) || {
          win: 0,
          lose: 0,
          draw: 0,
        };
        const total = stats.win + stats.lose + stats.draw;
        const winRate =
          total > 0 ? ((stats.win / total) * 100).toFixed(1) : "0.0";

        return (
          <GridItem
            key={lv}
            bg="linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <HStack justify="space-between" mb={3}>
              <Text fontSize="xs" fontWeight="bold" color="blue.400">
                LEVEL {lv}
              </Text>
              <Text fontSize="10px" fontWeight="bold" color="green.400">
                {winRate}%
              </Text>
            </HStack>
            <HStack justify="space-around" align="center">
              <StatBox label="WIN" value={stats.win} color="green.400" />
              <StatBox label="DRAW" value={stats.draw} color="gray.500" />
              <StatBox label="LOSE" value={stats.lose} color="red.400" />
            </HStack>
            <Box
              w="full"
              h="2px"
              bg="whiteAlpha.100"
              mt={3}
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                w={`${winRate}%`}
                h="full"
                bg="green.400"
                transformOrigin="left"
                animation={`${extendBounce} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both`}
                style={{
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </Box>
          </GridItem>
        );
      })}
    </Grid>
  </VStack>
);

export const SectionTitle = ({ icon, label }: any) => (
  <HStack gap={2}>
    <Icon as={icon} size="xs" color="gray.500" />
    <Text
      fontSize="10px"
      fontWeight="bold"
      color="gray.500"
      letterSpacing="widest"
    >
      {label}
    </Text>
  </HStack>
);

const StatBox = ({ label, value, color }: any) => (
  <VStack gap={0}>
    <Text fontSize="xl" fontWeight="900" color={color} lineHeight="1">
      {value}
    </Text>
    <Text
      fontSize="8px"
      fontWeight="bold"
      color="gray.600"
      letterSpacing="tighter"
    >
      {label}
    </Text>
  </VStack>
);
