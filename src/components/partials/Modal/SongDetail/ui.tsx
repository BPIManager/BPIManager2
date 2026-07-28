"use client";

import { useMemo, useState } from "react";
import { LineChart, LucideHistory, Users, DatabaseSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import { hasBpiData } from "@/utils/songs/songDetailMode";
import { BpiCalculator } from "@/lib/bpi";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import { SongHistoryTab } from "./History/ui";
import RivalsRanking from "./Rivals";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { DefinitionsTab } from "./Definitions/ui";
import { StatsTab } from "./Stats";

interface SongDetailViewProps {
  song: SongDetailSubject | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "stats" | "history" | "rivals" | "definitions";
}

export const SongDetailView = ({
  song,
  isOpen,
  onClose,
  defaultTab,
}: SongDetailViewProps) => {
  // 全難易度スコア(BPI未計算)にはStatistics/Definitionsタブを表示しない
  const fullSong = song && hasBpiData(song) ? song : null;
  const [tab, setTab] = useState<string>(
    defaultTab || (fullSong ? "stats" : "history"),
  );
  const tabs = fullSong
    ? [
        { value: "stats", label: "Statistics", icon: LineChart },
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
        { value: "definitions", label: "Definitions", icon: DatabaseSearch },
      ]
    : [
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
      ];

  const maxScore = song ? song.notes * 2 : 0;
  const currentEx = song ? song.exScore || 0 : 0;

  const rankInfo = useMemo(
    () => getRankDetail(currentEx, maxScore),
    [currentEx, maxScore],
  );

  const bpiInfo = useMemo(() => {
    if (!fullSong) return { next: 0 as number | string, diff: 0 };
    if (fullSong.bpi === null) return { next: "-", diff: 0 };
    const nextTargetBpi = Math.ceil((fullSong.bpi + 0.01) / 10) * 10;
    const targetScore = BpiCalculator.calcFromBPI(nextTargetBpi, fullSong, true);
    return { next: nextTargetBpi, diff: targetScore - currentEx };
  }, [fullSong, currentEx]);

  if (!song) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {song.title}
            <span className="ml-2 font-mono text-bpim-muted">
              [{song.difficulty.charAt(0)}]
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                EX Score
              </span>
              <span className="font-mono text-lg font-black text-bpim-text leading-none">
                {song.exScore ?? 0}
              </span>
              <span className="mt-1 font-mono text-[10px] font-bold text-bpim-muted">
                {(((song.exScore ?? 0) / maxScore) * 100).toFixed(2)}%
              </span>
            </div>

            {fullSong ? (
              <div className="flex flex-col gap-1 border-x border-bpim-border">
                <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                  BPI
                </span>
                <span className="font-mono text-lg font-black text-bpim-primary leading-none">
                  {fullSong.bpi !== null ? fullSong.bpi.toFixed(2) : "-"}
                </span>
                <span className="mt-1 text-[10px] font-bold text-bpim-primary/60">
                  {fullSong.bpi !== null
                    ? `BPI${bpiInfo.next}まで +${bpiInfo.diff}`
                    : "-"}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-x border-bpim-border">
                <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                  Miss Count
                </span>
                <span
                  className={cn(
                    "font-mono text-lg font-black leading-none",
                    song.missCount === 0
                      ? "text-bpim-success"
                      : song.missCount !== null
                        ? "text-bpim-danger"
                        : "text-bpim-subtle",
                  )}
                >
                  {song.missCount !== null ? song.missCount : "---"}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                DJ Rank
              </span>
              <span className="font-mono text-lg font-black text-yellow-500 leading-none">
                {rankInfo.label === "MAX-"
                  ? `MAX - ${maxScore - currentEx}`
                  : `${rankInfo.label} + ${rankInfo.surplus}`}
              </span>
              <span className="mt-1 text-[10px] font-bold text-bpim-danger/80">
                {rankInfo.label === "MAX-" ? "MAX" : rankInfo.nextLabel}まで{" "}
                {rankInfo.shortage}
              </span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <AppTabsList visual="card" cols={tabs.length}>
              {tabs.map((t) => (
                <AppTabsTrigger
                  key={t.value}
                  value={t.value}
                  visual="card"
                  icon={t.icon}
                  iconOnly
                >
                  {t.label}
                </AppTabsTrigger>
              ))}
            </AppTabsList>

            {fullSong && (
              <TabsContent value="stats" className="mt-0 outline-none">
                <StatsTab song={fullSong} />
              </TabsContent>
            )}

            <TabsContent value="history" className="mt-0 outline-none">
              <SongHistoryTab
                songId={song.songId}
                notes={fullSong ? undefined : song.notes}
              />
            </TabsContent>

            <TabsContent value="rivals" className="mt-0 outline-none">
              <RivalsRanking song={song} />
            </TabsContent>

            {fullSong && (
              <TabsContent value="definitions" className="mt-0 outline-none">
                <DefinitionsTab song={fullSong} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
