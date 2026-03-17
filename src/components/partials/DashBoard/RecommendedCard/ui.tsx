import { useState } from "react";
import { Tabs, useDisclosure } from "@chakra-ui/react";
import { useRecommendedInfinite } from "@/hooks/stats/useRecommended";
import { SimpleRankItem } from "./Common/SimpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/withScore";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { NearLoseList } from "./NearLose";
import { DashCard } from "@/components/ui/dashcard";
import { InfiniteScrollContainer } from "../../InfiniteScroll/ui";

const InfiniteList = ({ userId, type, onSelect }: any) => {
  const { levels, diffs, version } = useStatsFilter();
  const res = useRecommendedInfinite(userId, version, levels, diffs, type);

  return (
    <InfiniteScrollContainer
      {...res}
      renderItem={(item, i) => (
        <SimpleRankItem
          key={`${item.songId}-${i}`}
          item={item}
          rank={i + 1}
          onClick={() => onSelect(item)}
        />
      )}
    />
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
    <DashCard overflow="hidden" display="flex" p={0}>
      <Tabs.Root
        value={tab}
        onValueChange={(e) => setTab(e.value)}
        variant="plain"
        size="sm"
        flex="1"
      >
        <Tabs.List bg="whiteAlpha.50" p={1} borderRadius="lg" w="full">
          {[
            { value: "weapons", label: "武器曲かも?" },
            { value: "potential", label: "伸びるかも?" },
            { value: "nearLose", label: "ライバル僅差" },
          ].map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              flex={1}
              py={2}
              borderRadius="md"
              fontSize="xs"
              fontWeight="bold"
              justifyContent="center"
              _selected={{ bg: "#0d1117", color: "white" }}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="weapons" p={0}>
          <InfiniteList
            userId={userId}
            type="weapons"
            onSelect={handleSongSelect}
          />
        </Tabs.Content>
        <Tabs.Content value="potential" p={0}>
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
    </DashCard>
  );
};
