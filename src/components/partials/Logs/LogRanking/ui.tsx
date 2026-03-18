import { LuTrophy, LuTrendingUp, LuSwords } from "react-icons/lu";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RankItem } from "./item";
import { useLogRank } from "@/hooks/batches/useLogRank";
import { useState } from "react";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { OvertakeRankItem } from "../LogOvertaken/item";
import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";
import { SongWithScore } from "@/types/songs/withScore";
import { LabelWithTooltip } from "../LogSummary/ui";
import { cn } from "@/lib/utils";

const RANK_CONFIG = {
  growth: {
    title: "BPI伸び幅ランキング",
    icon: LuTrendingUp,
    accentColor: "text-green-400",
  },
  top: {
    title: "BPIランキング",
    icon: LuTrophy,
    accentColor: "text-yellow-400",
  },
  overtake: {
    title: (
      <LabelWithTooltip
        label="ライバルに勝利"
        isSharing={false}
        tooltipText="このスコアを出した瞬間に、ライバルを上回っていたものを表示しています。（その後にライバルに抜き返されても、この時の更新結果は変わりません）"
      />
    ),
    icon: LuSwords,
    accentColor: "text-orange-400",
  },
};

export const LogRank = ({
  details,
  type,
  isSharing,
}: {
  details: BatchDetailItem[];
  type: "growth" | "top" | "overtake";
  isSharing?: boolean;
}) => {
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const config = RANK_CONFIG[type];
  const {
    visibleSongs,
    hasMore,
    remainingCount,
    loadMore,
    hideNewRecords,
    setHideNewRecords,
    setDisplayLimit,
  } = useLogRank(details, type);

  const handleOpenDetail = (item: any) => {
    const mappedSong = {
      ...item,
      exScore: item.current.exScore,
      bpi: item.current.bpi,
      clearState: item.current.clearState,
      missCount: item.current.missCount,
    };
    setSelectedSong(mappedSong);
    setIsDetailOpen(true);
  };

  const Icon = config.icon;

  return (
    <div className="flex w-full flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.accentColor)} />
          <div className="text-sm font-bold tracking-widest text-slate-200 uppercase">
            {config.title}
          </div>
        </div>

        {type !== "top" && !isSharing && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">
              新規除外
            </span>
            <Switch
              checked={hideNewRecords}
              onCheckedChange={(checked) => {
                setHideNewRecords(checked);
                setDisplayLimit(5);
              }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        {visibleSongs.length === 0 ? (
          <div className="flex items-center justify-center p-8 bg-white/5">
            <span className="text-xs text-slate-500">データがありません</span>
          </div>
        ) : (
          visibleSongs.map((item, index) => (
            <div key={item.songId}>
              {type === "overtake" ? (
                <OvertakeRankItem
                  item={item}
                  onClick={() => handleOpenDetail(item)}
                />
              ) : (
                <RankItem
                  isSharing={isSharing}
                  item={item}
                  rank={index + 1}
                  type={type}
                  onClick={() => handleOpenDetail(item)}
                />
              )}
              {index !== visibleSongs.length - 1 && (
                <Separator className="bg-slate-900" />
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:bg-white/5 hover:text-slate-300"
          onClick={loadMore}
        >
          もっと表示（残り {remainingCount} 件）
        </Button>
      )}

      {selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};
