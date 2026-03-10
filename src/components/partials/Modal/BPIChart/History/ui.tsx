import { useUser } from "@/contexts/users/UserContext";
import { useScoreHistory } from "@/hooks/score/useScoreLogs";
import { Score } from "@/types/sql";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Separator,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { LuTrendingUp, LuCalendar, LuHistory, LuCrown } from "react-icons/lu";
import { useMemo } from "react";
import { versionTitles } from "@/constants/versions";
import dayjs from "@/lib/dayjs";

interface SongHistoryTabProps {
  songId: number;
}

export const SongHistoryTab = ({ songId }: SongHistoryTabProps) => {
  const { fbUser } = useUser();
  const { historyGroups, isLoading, isError } = useScoreHistory(
    fbUser?.uid,
    songId,
  );
  const globalMaxScore = useMemo(() => {
    if (!historyGroups) return 0;
    return Math.max(
      ...Object.values(historyGroups)
        .flat()
        .map((s) => s.exScore),
    );
  }, [historyGroups]);

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner color="blue.500" size="lg" />
      </Center>
    );
  }

  if (isError || !historyGroups || Object.keys(historyGroups).length === 0) {
    return (
      <Center py={20} flexDirection="column" gap={3}>
        <LuHistory size={40} color="gray.600" />
        <Text color="gray.500" fontSize="sm">
          履歴データが見つかりません
        </Text>
      </Center>
    );
  }

  const sortedVersions = Object.keys(historyGroups).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <VStack align="stretch" gap={6} maxH="450px" overflowY="auto" pr={2}>
      {sortedVersions.map((version) => {
        const vInfo = versionTitles.find((v) => v.num === version);
        const displayTitle = vInfo ? vInfo.title : `Ver.${version}`;
        return (
          <Box key={version}>
            <HStack mb={3} px={1}>
              <Text color="gray.400" fontSize={"xs"}>
                {displayTitle}
              </Text>
              <Separator flex={1} opacity={0.1} />
            </HStack>

            <VStack align="stretch" gap={2.5}>
              {historyGroups[version].map((record: Score, idx: number) => {
                const prevInVersion = historyGroups[version][idx + 1];
                const scoreDiff = prevInVersion
                  ? record.exScore - prevInVersion.exScore
                  : null;

                const isGlobalBest =
                  record.exScore === globalMaxScore && globalMaxScore > 0;

                return (
                  <Box
                    key={record.logId}
                    p={3}
                    bg="whiteAlpha.50"
                    rounded="md"
                    borderLeft="3px solid"
                    borderColor={isGlobalBest ? "yellow.500" : "whiteAlpha.200"}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack gap={1.5} color="gray.500">
                        <LuCalendar size={12} />
                        <Text fontSize="10px" fontWeight="medium">
                          {dayjs(record.lastPlayed)
                            .tz()
                            .format("YYYY/MM/DD HH:mm")}
                        </Text>
                      </HStack>

                      <HStack gap={2}>
                        {scoreDiff !== null && scoreDiff > 0 && (
                          <Badge
                            size="sm"
                            colorPalette="green"
                            variant="subtle"
                            px={2}
                          >
                            <HStack gap={0.5}>
                              <LuTrendingUp size={10} />
                              <Text fontSize="9px">+{scoreDiff}</Text>
                            </HStack>
                          </Badge>
                        )}

                        {isGlobalBest && (
                          <Badge
                            size="sm"
                            colorPalette="yellow"
                            variant="solid"
                            px={1.5}
                          >
                            <HStack gap={1}>
                              <LuCrown size={10} />
                              <Text fontSize="9px">BEST</Text>
                            </HStack>
                          </Badge>
                        )}
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" align="flex-end">
                      <VStack align="start" gap={0}>
                        <HStack align="baseline" gap={1.5}>
                          <Text
                            fontSize="md"
                            fontWeight="bold"
                            color={isGlobalBest ? "yellow.200" : "white"}
                            letterSpacing="tight"
                          >
                            {record.exScore}
                          </Text>
                        </HStack>
                        <Text
                          fontSize="10px"
                          color="gray.200"
                          fontWeight="bold"
                        >
                          BPI: {(record.bpi || -15).toFixed(2)}
                        </Text>
                      </VStack>

                      <VStack align="end" gap={0.5}>
                        <Text fontSize="xs" fontWeight="bold" color="gray.300">
                          {record.clearState || "NO PLAY"}
                        </Text>
                        {record.missCount !== null && (
                          <Text
                            fontSize="9px"
                            color="gray.200"
                            fontWeight="bold"
                          >
                            MISS: {record.missCount}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
};
