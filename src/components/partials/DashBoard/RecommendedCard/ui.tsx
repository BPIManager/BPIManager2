import { useState } from "react";
import { useRecommendedInfinite, RecommendedItem } from "@/hooks/stats/useRecommended";
import { SimpleRankItem } from "./Common/SimpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/withScore";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { NearLoseList } from "./NearLose";
import { DashCard } from "@/components/ui/dashcard";
import { InfiniteScrollContainer } from "../../InfiniteScroll/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // shadcn/ui
import { AppTabsGroup } from "@/components/ui/complex/tabs";

interface InfiniteListProps {
  userId: string;
  type: "weapons" | "potential";
  onSelect: (item: RecommendedItem) => void;
}

const InfiniteList = ({ userId, type, onSelect }: InfiniteListProps) => {
  const { levels, diffs, version } = useStatsFilter();
  const res = useRecommendedInfinite(userId, version, levels, diffs, type);

  return (
    <InfiniteScrollContainer
      {...res}
      renderItem={(item: RecommendedItem, i: number) => (
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [tab, setTab] = useState<string>("weapons");

  const handleSongSelect = (item: SongWithScore) => {
    setSelectedSong(item);
    setIsDetailOpen(true);
  };

  return (
    <DashCard className="flex flex-col p-0 overflow-hidden border border-bpim-border">
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col w-full">
        <AppTabsGroup
          visual="minimal"
          tabs={[
            { value: "weapons", label: "武器曲かも?" },
            { value: "potential", label: "伸びるかも?" },
            { value: "nearLose", label: "ライバル僅差" },
          ]}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar h-112.5">
          <TabsContent
            value="weapons"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <InfiniteList
              userId={userId}
              type="weapons"
              onSelect={handleSongSelect}
            />
          </TabsContent>
          <TabsContent
            value="potential"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <InfiniteList
              userId={userId}
              type="potential"
              onSelect={handleSongSelect}
            />
          </TabsContent>
          <TabsContent
            value="nearLose"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NearLoseList userId={userId} onSelect={handleSongSelect} />
          </TabsContent>
        </div>
      </Tabs>

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          defaultTab={tab === "nearLose" ? "rivals" : "stats"}
        />
      )}
    </DashCard>
  );
};
