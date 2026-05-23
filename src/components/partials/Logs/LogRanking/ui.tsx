import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RankItem } from "./item";
import { useLogRank } from "@/hooks/batches/useLogRank";
import { useMemo, useState } from "react";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";
import { OvertakeRankItem } from "../LogOvertaken/item";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import { SongWithScore } from "@/types/songs/score";
import { LabelWithTooltip } from "../LogSummary/ui";
import { cn } from "@/lib/utils";
import { Swords, TrendingUp, Trophy } from "lucide-react";

const RANK_CONFIG = {
  growth: {
    title: "BPI伸び幅ランキング",
    icon: TrendingUp,
    accentColor: "text-bpim-success",
  },
  top: {
    title: "BPIランキング",
    icon: Trophy,
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
    icon: Swords,
    accentColor: "text-bpim-warning",
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
  const [selectedRivalId, setSelectedRivalId] = useState<string>("");

  const config = RANK_CONFIG[type];

  const allRivals = useMemo(() => {
    if (type !== "overtake") return [];
    const map = new Map<string, string>();
    for (const d of details) {
      for (const r of d.overtaken ?? []) {
        map.set(r.rivalUserId, r.rivalName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [details, type]);

  const filteredDetails = useMemo(() => {
    if (type !== "overtake" || !selectedRivalId) return details;
    return details.map((d) => ({
      ...d,
      overtaken: (d.overtaken ?? []).filter(
        (r) => r.rivalUserId === selectedRivalId,
      ),
    }));
  }, [details, type, selectedRivalId]);

  const {
    visibleSongs,
    hasMore,
    remainingCount,
    loadMore,
    hideNewRecords,
    setHideNewRecords,
    setDisplayLimit,
  } = useLogRank(filteredDetails, type);

  const handleOpenDetail = (item: BatchDetailItem) => {
    const mappedSong = {
      ...item,
      logId: null,
      scoreAt: null,
      bpm: item.bpm ?? null,
      releasedVersion: item.releasedVersion ?? null,
      wrScore: item.wrScore ?? null,
      kaidenAvg: item.kaidenAvg ?? null,
      coef: item.coef ?? null,
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
          <div className="text-sm font-bold tracking-widest text-bpim-text uppercase">
            {config.title}
          </div>
        </div>

        {type !== "top" && !isSharing && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-bpim-muted">
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

      {type === "overtake" && allRivals.length > 0 && (
        <Select
          value={selectedRivalId}
          onValueChange={(v) => {
            const isAll = v === "all";
            setSelectedRivalId(isAll ? "" : v);
            setDisplayLimit(isAll ? 5 : 99999);
          }}
        >
          <SelectTrigger className="h-8 w-full text-xs bg-bpim-surface-2 border-bpim-border text-bpim-text">
            <SelectValue placeholder="すべて" />
          </SelectTrigger>
          <SelectContent className="bg-bpim-surface-2 border-bpim-border text-bpim-text">
            <SelectItem value="all" className="text-xs">
              すべて（{details.filter((d) => (d.overtaken ?? []).length > 0).length}件）
            </SelectItem>
            {allRivals.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs">
                {r.name}（{details.filter((d) => (d.overtaken ?? []).some((o) => o.rivalUserId === r.id)).length}件）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg">
        {visibleSongs.length === 0 ? (
          <div className="flex items-center justify-center p-8 bg-bpim-surface-2/60">
            <span className="text-xs text-bpim-muted">データがありません</span>
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
                <Separator className="bg-bpim-bg" />
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text"
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
