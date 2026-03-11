import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  GridItem,
  Separator,
  Badge,
  Tabs,
} from "@chakra-ui/react";
import { SongWithScore } from "@/types/songs/withScore";
import { useMemo, useState } from "react";
import { BpiCalculator } from "@/lib/bpi";
import { BPIChart } from "./chart";
import { getRankDetail } from "@/constants/djRank";
import { LineChart, LucideHistory, Users } from "lucide-react";
import { SongHistoryTab } from "../History/ui";
import RivalsRanking from "../Rivals";

export const SongDetailView = ({
  song,
  isOpen,
  onClose,
}: {
  song: SongWithScore | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [tab, setTab] = useState<string>("stats");

  const chartData = useMemo(() => {
    if (!song) return [];
    const data: { label: string; count: number; bpi: number }[] = [];
    const bpiBasis = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

    bpiBasis.forEach((bpiValue) => {
      const targetScore = BpiCalculator.calcFromBPI(bpiValue, song, true);
      data.push({
        label: String(bpiValue),
        count: targetScore,
        bpi: bpiValue,
      });
    });

    if (song.exScore !== null && song.exScore > 0) {
      data.push({
        label: "YOU",
        count: song.exScore,
        bpi: song.bpi ?? 0,
      });
    }
    return data.sort((a, b) => b.count - a.count);
  }, [song]);

  const maxScore = song ? song.notes * 2 : 0;
  const currentEx = song ? song.exScore || 0 : 0;

  const rankInfo = useMemo(
    () => getRankDetail(currentEx, maxScore),
    [currentEx, maxScore],
  );

  const bpiInfo = useMemo(() => {
    if (!song) return { next: 0, diff: 0 };
    if (song.bpi === null) return { next: "-", diff: 0 };
    const nextTargetBpi = Math.ceil((song.bpi + 0.01) / 10) * 10;

    const targetScore = BpiCalculator.calcFromBPI(nextTargetBpi, song, true);
    return {
      next: nextTargetBpi,
      diff: targetScore - currentEx,
    };
  }, [song, currentEx]);

  if (!song) return null;
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={onClose}
      size="lg"
      placement={{ mdDown: "top", md: "center" }}
    >
      <DialogContent
        bg="gray.950"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <DialogHeader
          borderBottomWidth="1px"
          borderColor="whiteAlpha.100"
          p={4}
        >
          <DialogTitle fontSize="md" color="white">
            {song.title}&nbsp;[{song.difficulty.charAt(0)}]
          </DialogTitle>
          <DialogCloseTrigger color="white" />
        </DialogHeader>
        <DialogBody py={6}>
          <Grid
            templateColumns="repeat(3, 1fr)"
            gap={4}
            textAlign="center"
            mb={6}
          >
            <GridItem>
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                EX SCORE
              </Text>
              <Text fontSize="md" fontWeight="bold" color="white">
                {song.exScore ?? 0}
              </Text>
              <Text fontSize="10px" color="gray.200" mt={1}>
                {(((song.exScore ?? 0) / (song.notes * 2)) * 100).toFixed(2)}%
              </Text>
            </GridItem>
            <GridItem
              borderLeftWidth="1px"
              borderRightWidth="1px"
              borderColor="whiteAlpha.100"
            >
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                BPI
              </Text>
              <Text fontSize="md" fontWeight="bold" color="blue.300">
                {song.bpi !== null ? song.bpi.toFixed(2) : "-"}
              </Text>
              <Text fontSize="10px" color="gray.200" mt={1}>
                {song.bpi !== null
                  ? `BPI${bpiInfo.next}まであと${bpiInfo.diff}点`
                  : "-"}
              </Text>
            </GridItem>
            <GridItem>
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                DJ RANK
              </Text>
              <Text fontSize="md" fontWeight="bold" color="yellow.400">
                {rankInfo.label === "MAX-" ? (
                  <>MAX - {maxScore - currentEx}</>
                ) : (
                  <>
                    {rankInfo.label} + {rankInfo.surplus}
                  </>
                )}
              </Text>
              <VStack gap={0} mt={1}>
                <Text fontSize="9px" color="red.300">
                  {rankInfo.label === "MAX-" ? "MAX" : rankInfo.nextLabel}まで{" "}
                  {rankInfo.shortage}
                </Text>
              </VStack>
            </GridItem>
          </Grid>
          <Tabs.Root
            value={tab}
            onValueChange={(e) => setTab(e.value)}
            variant="enclosed"
            fitted
          >
            <Tabs.List
              bg="whiteAlpha.50"
              p={1}
              rounded="md"
              border="none"
              mb={4}
            >
              <Tabs.Trigger value="stats" gap={2}>
                <LineChart /> <Text fontSize="xs">STATISTICS</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="history" gap={2}>
                <LucideHistory /> <Text fontSize="xs">HISTORY</Text>
              </Tabs.Trigger>
              <Tabs.Trigger value="rivals" gap={2}>
                <Users /> <Text fontSize="xs">RIVALS</Text>
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="stats">
              <BPIChart
                data={chartData}
                maxScore={song.notes * 2}
                song={song}
              />
              <Box
                mt={6}
                p={4}
                bg="whiteAlpha.50"
                rounded="md"
                borderWidth="1px"
                borderColor="whiteAlpha.100"
              >
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.400">全1</Text>
                    <Text fontWeight="bold" color="white">
                      {song.wrScore ?? 0}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.400">皆伝平均</Text>
                    <Text fontWeight="bold" color="white">
                      {song.kaidenAvg ?? 0}
                    </Text>
                  </HStack>
                  <Separator opacity={0.1} my={1} />
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.400">ランプ状態</Text>
                    <Badge colorScheme="yellow">
                      {song.clearState || "NO PLAY"}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.400">ミスカウント</Text>
                    <Text fontWeight="bold" color="red.400">
                      {song.missCount ?? "-"}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </Tabs.Content>
            <Tabs.Content value="history">
              <SongHistoryTab songId={song.songId} />
            </Tabs.Content>
            <Tabs.Content value="rivals">
              <RivalsRanking song={song} />
            </Tabs.Content>
          </Tabs.Root>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
};
