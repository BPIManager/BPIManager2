import { useState } from "react";
import { useNeighborRecommendedInfinite } from "@/hooks/stats/useNeighborRecommended";
import { NeighborRecommendedItem } from "@/types/stats/neighborRecommended";
import { SimpleRankItem } from "./Common/SimpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/score";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { NearLoseList } from "./NearLose";
import { DashCard } from "@/components/ui/dashcard";
import { InfiniteScrollContainer } from "../../InfiniteScroll/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { HelpTooltip } from "@/components/ui/tooltip";

const HelpText = (
  <div className="space-y-3">
    <section>
      <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
        仕組み
      </p>
      <p>
        自分の<span className="text-bpim-primary font-bold">総合BPI</span>
        に近いプレイヤーをN名選出し、その近傍グループ内での
        <span className="text-bpim-warning font-bold">相対的なスコア差</span>
        を楽曲ごとに算出します。
      </p>
    </section>

    <section>
      <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
        各タブの意味
      </p>
      <ul className="space-y-2">
        <li>
          <span className="font-bold">武器曲かも?</span>
          ：近傍N名の平均BPIより自分のBPIが高い楽曲。差が大きいほど得意な曲です。
        </li>
        <li>
          <span className="font-bold">伸びるかも?</span>
          ：近傍N名の平均BPIより自分のBPIが低い楽曲。同レベル帯の人が取れているスコアに届いていない曲を示します。
        </li>
      </ul>
    </section>

    <section>
      <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
        N名の調整
      </p>
      <p>
        タブ下のボタンで<span className="font-bold">10 / 20 / 50</span>
        名を切り替えられます。少ないほど自分に近い実力帯に絞った比較、多いほど広いサンプルとの比較になります。
      </p>
    </section>

    <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
      <p>
        近傍プレイヤーがプレイしていない曲はリストに表示されません。Nを増やすと表示される曲数が増える場合があります。
      </p>
    </section>
  </div>
);

const NEIGHBOR_OPTIONS = [10, 20, 50] as const;
type NeighborN = (typeof NEIGHBOR_OPTIONS)[number];

interface NeighborInfiniteListProps {
  userId: string;
  type: "weapons" | "potential";
  n: NeighborN;
  onSelect: (item: NeighborRecommendedItem) => void;
}

const NeighborInfiniteList = ({
  userId,
  type,
  n,
  onSelect,
}: NeighborInfiniteListProps) => {
  const { levels, diffs, version } = useStatsFilter();
  const res = useNeighborRecommendedInfinite(
    userId,
    version,
    levels,
    diffs,
    type,
    n,
  );

  return (
    <InfiniteScrollContainer
      {...res}
      renderItem={(item: NeighborRecommendedItem, i: number) => (
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
  const [neighborN, setNeighborN] = useState<NeighborN>(20);

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

        {tab !== "nearLose" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-bpim-border bg-bpim-surface-1">
            <span className="text-[10px] font-bold text-bpim-subtle">
              近傍
            </span>
            {NEIGHBOR_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setNeighborN(opt)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                  neighborN === opt
                    ? "bg-bpim-primary text-white"
                    : "text-bpim-muted hover:text-bpim-text"
                }`}
              >
                {opt}名
              </button>
            ))}
            <div className="ml-auto">
              <HelpTooltip align="right">{HelpText}</HelpTooltip>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar h-112.5">
          <TabsContent
            value="weapons"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NeighborInfiniteList
              userId={userId}
              type="weapons"
              n={neighborN}
              onSelect={handleSongSelect}
            />
          </TabsContent>
          <TabsContent
            value="potential"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NeighborInfiniteList
              userId={userId}
              type="potential"
              n={neighborN}
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
