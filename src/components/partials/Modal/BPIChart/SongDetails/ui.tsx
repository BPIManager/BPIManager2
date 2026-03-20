"use client";

import { useMemo, useState } from "react";
import { LineChart, LucideHistory, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { SongWithScore } from "@/types/songs/withScore";
import { BpiCalculator } from "@/lib/bpi";
import { BPIChart } from "./chart";
import { getRankDetail } from "@/constants/djRank";
import { SongHistoryTab } from "../History/ui";
import RivalsRanking from "../Rivals";
import { cn } from "@/lib/utils";

interface SongDetailViewProps {
  song: SongWithScore | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "stats" | "history" | "rivals";
}

export const SongDetailView = ({
  song,
  isOpen,
  onClose,
  defaultTab,
}: SongDetailViewProps) => {
  const [tab, setTab] = useState<string>(defaultTab || "stats");
  const tabs = [
    { value: "stats", label: "Statistics", icon: LineChart },
    { value: "history", label: "History", icon: LucideHistory },
    { value: "rivals", label: "Rivals", icon: Users },
  ];

  const chartData = useMemo(() => {
    if (!song) return [];
    const data: { label: string; count: number; bpi: number }[] = [];
    const bpiBasis = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

    bpiBasis.forEach((bpiValue) => {
      const targetScore = BpiCalculator.calcFromBPI(bpiValue, song, true);
      data.push({ label: String(bpiValue), count: targetScore, bpi: bpiValue });
    });

    if (song.exScore !== null && song.exScore > 0) {
      data.push({ label: "YOU", count: song.exScore, bpi: song.bpi ?? 0 });
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
    return { next: nextTargetBpi, diff: targetScore - currentEx };
  }, [song, currentEx]);

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

            <div className="flex flex-col gap-1 border-x border-bpim-border">
              <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                BPI
              </span>
              <span className="font-mono text-lg font-black text-bpim-primary leading-none">
                {song.bpi !== null ? song.bpi.toFixed(2) : "-"}
              </span>
              <span className="mt-1 text-[10px] font-bold text-bpim-primary/60">
                {song.bpi !== null
                  ? `BPI${bpiInfo.next}まで +${bpiInfo.diff}`
                  : "-"}
              </span>
            </div>

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
            <TabsList
              className={cn(
                "grid w-full grid-cols-3 rounded-xl p-1.5 h-12 items-stretch",
                "border",
              )}
            >
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className={cn(
                      "flex h-full items-center justify-center gap-2.5 py-0",
                      "text-[14px] leading-none transition-all rounded-lg",
                      "data-[state=active]:bg-bpim-primary",
                      "data-[state=active]:shadow-lg",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline tracking-tighter">
                      {t.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="stats" className="mt-0 outline-none">
              <BPIChart data={chartData} maxScore={maxScore} song={song} />

              <div className="mt-4 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      World Record
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.wrScore ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      Kaiden Average
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.kaidenAvg ?? 0}
                    </span>
                  </div>
                  <Separator className="my-1 bg-bpim-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      Clear Lamp
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.clearState || "NO PLAY"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      Miss Count
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-danger">
                      {song.missCount ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 outline-none">
              <SongHistoryTab songId={song.songId} />
            </TabsContent>

            <TabsContent value="rivals" className="mt-0 outline-none">
              <RivalsRanking song={song} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
