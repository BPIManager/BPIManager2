import { useEffect, useRef, useState } from "react";
import {
  Box,
  Tabs,
  VStack,
  Spinner,
  Center,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRecommendedInfinite } from "@/hooks/stats/useRecommended";
import { SimpleRankItem } from "./Common/SimpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/withScore";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { NearLoseList } from "./NearLose";

const InfiniteList = ({
  userId,
  type,
  onSelect,
}: {
  userId: string;
  type: "weapons" | "potential";
  onSelect: (item: any) => void;
}) => {
  const { levels, diffs, version } = useStatsFilter();
  const { items, setSize, size, isLoadingMore, isReachingEnd } =
    useRecommendedInfinite(userId, version, levels, diffs, type);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize(size + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [setSize, size, isReachingEnd, isLoadingMore]);

  return (
    <VStack align="stretch" gap={0} maxH="500px" overflowY="auto">
      {items.map((item, i) => (
        <SimpleRankItem
          onClick={() => onSelect(item)}
          key={`${item.songId}-${i}`}
          item={item}
          rank={i + 1}
        />
      ))}
      <Box ref={observerTarget} py={4}>
        {isLoadingMore && (
          <Center>
            <Spinner size="sm" />
          </Center>
        )}
        {items.length > 0 && isReachingEnd && (
          <Center>
            <Text fontSize="xs" color="gray.600">
              全てのデータを読み込みました
            </Text>
          </Center>
        )}
      </Box>
    </VStack>
  );
};

export const RankingTabsCard = ({ userId }: { userId: string }) => {
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const { open, onOpen, onClose } = useDisclosure();
  const [tab, setTab] = useState<string>("weapons");

  const handleSongSelect = (item: any) => {
    setSelectedSong(item);
    onOpen();
  };

  return (
    <Box
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      overflow="hidden"
      display="flex"
    >
      <Tabs.Root
        value={tab}
        onValueChange={(e) => setTab(e.value)}
        variant="plain"
        size="sm"
        flex="1"
      >
        <Tabs.List bg="whiteAlpha.50" p={1} borderRadius="lg" w="full">
          <Tabs.Trigger
            value="weapons"
            flex={1}
            _selected={{ bg: "#0d1117", color: "white" }}
            py={2}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            display={"flex"}
            justifyContent={"center"}
          >
            武器曲かも?
          </Tabs.Trigger>
          <Tabs.Trigger
            value="potential"
            flex={1}
            _selected={{ bg: "#0d1117", color: "white" }}
            py={2}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            display={"flex"}
            justifyContent={"center"}
          >
            伸びるかも?
          </Tabs.Trigger>
          <Tabs.Trigger
            value="nearLose"
            flex={1}
            _selected={{ bg: "#0d1117", color: "white" }}
            py={2}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            display={"flex"}
            justifyContent={"center"}
          >
            ライバル僅差
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="weapons" p={0} flex="1" minH="0" height="100%">
          <InfiniteList
            userId={userId}
            type="weapons"
            onSelect={handleSongSelect}
          />
        </Tabs.Content>
        <Tabs.Content value="potential" p={0} flex="1" minH="0" height="100%">
          <InfiniteList
            userId={userId}
            type="potential"
            onSelect={handleSongSelect}
          />
        </Tabs.Content>
        <Tabs.Content value="nearLose" p={0}>
          <NearLoseList userId={userId} onSelect={handleSongSelect} />
        </Tabs.Content>
      </Tabs.Root>
      {open && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={open}
          onClose={onClose}
          defaultTab={tab === "nearLose" ? "rivals" : "stats"}
        />
      )}
    </Box>
  );
};
