"use client";

import { useMemo, useState } from "react";
import { LineChart, LucideHistory, Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { SongWithScore } from "@/types/songs/withScore";
import { BpiCalculator } from "@/lib/bpi";
import { BPIChart } from "./chart";
import { getRankDetail } from "@/constants/djRank";
import { SongHistoryTab } from "../History/ui";
import RivalsRanking from "../Rivals";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 border-white/10 bg-slate-950 p-0 shadow-2xl overflow-hidden rounded-2xl">
        <DialogHeader className="border-b border-white/10 p-4 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-black tracking-tight text-white">
            {song.title}
            <span className="ml-2 text-slate-500 font-mono">
              [{song.difficulty.charAt(0)}]
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="mb-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                EX Score
              </span>
              <span className="font-mono text-lg font-black text-white leading-none">
                {song.exScore?.toLocaleString() ?? 0}
              </span>
              <span className="text-[10px] font-bold text-slate-400 mt-1 font-mono">
                {(((song.exScore ?? 0) / maxScore) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex flex-col gap-1 border-x border-white/5">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                BPI
              </span>
              <span className="font-mono text-lg font-black text-blue-400 leading-none">
                {song.bpi !== null ? song.bpi.toFixed(2) : "-"}
              </span>
              <span className="text-[10px] font-bold text-blue-300/60 mt-1">
                {song.bpi !== null
                  ? `BPI${bpiInfo.next}まで +${bpiInfo.diff}`
                  : "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                DJ Rank
              </span>
              <span className="font-mono text-lg font-black text-yellow-500 leading-none">
                {rankInfo.label === "MAX-"
                  ? `MAX - ${maxScore - currentEx}`
                  : `${rankInfo.label} + ${rankInfo.surplus}`}
              </span>
              <span className="text-[10px] font-bold text-red-400/80 mt-1">
                {rankInfo.label === "MAX-" ? "MAX" : rankInfo.nextLabel}まで{" "}
                {rankInfo.shortage}
              </span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl border border-white/5 bg-slate-900/50 p-1">
              <TabsTrigger
                value="stats"
                className="flex items-center gap-2 py-2 text-[10px] font-black uppercase data-[state=active]:bg-blue-600"
              >
                <LineChart className="h-3.5 w-3.5" /> STATISTICS
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 py-2 text-[10px] font-black uppercase data-[state=active]:bg-blue-600"
              >
                <LucideHistory className="h-3.5 w-3.5" /> HISTORY
              </TabsTrigger>
              <TabsTrigger
                value="rivals"
                className="flex items-center gap-2 py-2 text-[10px] font-black uppercase data-[state=active]:bg-blue-600"
              >
                <Users className="h-3.5 w-3.5" /> RIVALS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="mt-0 outline-none">
              <BPIChart data={chartData} maxScore={maxScore} song={song} />

              <div className="mt-6 rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      World Record
                    </span>
                    <span className="font-mono text-sm font-black text-white">
                      {song.wrScore?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Kaiden Average
                    </span>
                    <span className="font-mono text-sm font-black text-white">
                      {song.kaidenAvg?.toLocaleString() ?? 0}
                    </span>
                  </div>
                  <Separator className="bg-white/5 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Clear Lamp
                    </span>
                    <Badge className="bg-yellow-600 hover:bg-yellow-600 text-black font-black text-[10px] border-none px-2 h-5">
                      {song.clearState || "NO PLAY"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Miss Count
                    </span>
                    <span className="font-mono text-sm font-black text-red-500">
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
