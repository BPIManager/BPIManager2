import { useState } from "react";
import { useRecommendedInfinite } from "@/hooks/stats/useRecommended";
import { SimpleRankItem } from "./Common/SimpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/withScore";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { NearLoseList } from "./NearLose";
import { DashCard } from "@/components/ui/chakra/dashcard";
import { InfiniteScrollContainer } from "../../InfiniteScroll/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // shadcn/ui

const InfiniteList = ({ userId, type, onSelect }: any) => {
  const { levels, diffs, version } = useStatsFilter();
  const res = useRecommendedInfinite(userId, version, levels, diffs, type);

  return (
    <InfiniteScrollContainer
      {...res}
      renderItem={(item: any, i: number) => (
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

  const handleSongSelect = (item: any) => {
    setSelectedSong(item);
    setIsDetailOpen(true);
  };

  return (
    <DashCard className="flex p-0 overflow-hidden">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 flex-col w-full"
      >
        <div className="p-1">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-lg bg-white/5 p-1">
            {[
              { value: "weapons", label: "武器曲かも?" },
              { value: "potential", label: "伸びるかも?" },
              { value: "nearLose", label: "ライバル僅差" },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="py-2 text-xs font-bold transition-all data-[state=active]:bg-[#0d1117] data-[state=active]:text-white"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

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
