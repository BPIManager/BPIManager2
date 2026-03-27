"use client";

import { useState } from "react";
import { LucideHistory, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { cn } from "@/lib/utils";
import { getLampClass } from "@/components/partials/Table/ui";

const diffLabel: Record<string, string> = {
  BEGINNER: "B",
  NORMAL: "N",
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

import RivalsRanking from "@/components/partials/Modal/BPIChart/Rivals";
import { AllSongWithScore } from "@/types/songs/allSongs";
import { AllSongHistoryTab } from "./History";

interface AllSongDetailModalProps {
  song: AllSongWithScore | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AllSongDetailModal = ({
  song,
  isOpen,
  onClose,
}: AllSongDetailModalProps) => {
  const [tab, setTab] = useState("history");

  const tabs = [
    { value: "history", label: "History", icon: LucideHistory },
    { value: "rivals", label: "Rivals", icon: Users },
  ];

  if (!song) return null;

  const maxScore = song.notes * 2;
  const rate =
    song.exScore !== null ? ((song.exScore / maxScore) * 100).toFixed(2) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        placement="bottom-sheet"
        disableScrollWrapper
        className="flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="border-b p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-black tracking-tight">
              {song.title}
              <span className="ml-2 font-mono text-bpim-muted text-sm">
                [{diffLabel[song.difficulty]}]
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                EX Score
              </span>
              <span className="font-mono text-lg font-black text-bpim-text leading-none">
                {song.exScore ?? "---"}
              </span>
            </div>

            <div className="flex flex-col gap-1 border-x border-bpim-border">
              <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                Rate
              </span>
              <span className="font-mono text-lg font-black text-bpim-text leading-none">
                {rate ? `${rate}%` : "-"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
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
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <AppTabsList visual="card" cols={2}>
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

            <TabsContent value="history" className="mt-0 outline-none">
              <AllSongHistoryTab songId={song.songId} />
            </TabsContent>

            <TabsContent value="rivals" className="mt-0 outline-none">
              <RivalsRanking
                song={
                  {
                    ...song,
                    bpi: null,
                    wrScore: null,
                    kaidenAvg: null,
                    coef: null,
                    scoreAt: song.lastPlayed,
                    logId: song.logId,
                  } as any
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
