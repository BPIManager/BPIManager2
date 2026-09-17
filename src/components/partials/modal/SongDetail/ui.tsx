"use client";

import { LineChart, PencilIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

import type { SongDetailSubject } from "@/utils/songs/songDetailMode";
import type { SongWithScore } from "@/types/songs/score";
import SongHistoryTab from "./History/ui";
import RivalsRanking from "./Rivals";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import StatsTab from "./Stats";

interface RankInfo {
  label: string;
  surplus: number;
  nextLabel: string;
  shortage: number;
}

interface TabItem {
  value: string;
  label: string;
  icon: typeof LineChart;
}

interface SongDetailModalViewProps {
  song: SongDetailSubject;
  fullSong: SongWithScore | null;
  displaySong: SongWithScore | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tab: string;
  onTabChange: (tab: string) => void;
  tabs: TabItem[];
  edit: {
    canEdit: boolean;
    isEditing: boolean;
    draftExScore: number | null;
    onDraftExScoreChange: (value: number | null) => void;
    isSaving: boolean;
    canSave: boolean;
    onStartEditing: () => void;
    onCancelEditing: () => void;
    onSave: () => void;
  };
  display: {
    maxScore: number;
    displayEx: number;
    rankInfo: RankInfo;
    draftBpi: number | null;
    bpiInfo: { next: number | string; diff: number };
  };
}

const SongDetailModalView = ({
  song,
  fullSong,
  displaySong,
  isOpen,
  onOpenChange,
  tab,
  onTabChange,
  tabs,
  edit,
  display,
}: SongDetailModalViewProps) => {
  const { maxScore, displayEx, rankInfo, draftBpi, bpiInfo } = display;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          {edit.isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-bpim-muted hover:text-bpim-text"
                onClick={edit.onCancelEditing}
                disabled={edit.isSaving}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 bg-bpim-primary px-4 font-bold hover:bg-bpim-primary"
                onClick={edit.onSave}
                disabled={!edit.canSave || edit.isSaving}
              >
                {edit.isSaving ? <LoadingSpinner size="sm" /> : "保存"}
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                EX Score
                {edit.canEdit && !edit.isEditing && (
                  <button
                    type="button"
                    onClick={edit.onStartEditing}
                    className="text-bpim-muted hover:text-bpim-primary"
                    aria-label="EXスコアを編集"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
              {edit.isEditing ? (
                <Input
                  type="number"
                  autoFocus
                  min={0}
                  max={maxScore}
                  value={edit.draftExScore ?? ""}
                  onChange={(e) =>
                    edit.onDraftExScoreChange(
                      e.target.value
                        ? Math.min(maxScore, Math.max(0, Number(e.target.value)))
                        : null,
                    )
                  }
                  className="h-8 font-mono text-lg font-black"
                />
              ) : (
                <span
                  className={cn(
                    "font-mono text-lg font-black text-bpim-text leading-none",
                    edit.canEdit && "cursor-pointer hover:text-bpim-primary",
                  )}
                  onClick={edit.onStartEditing}
                >
                  {displayEx}
                </span>
              )}
              <span className="mt-1 font-mono text-[10px] font-bold text-bpim-muted">
                {((displayEx / maxScore) * 100).toFixed(2)}%
              </span>
            </div>

            {fullSong ? (
              <div className="flex flex-col gap-1 border-x border-bpim-border">
                <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                  BPI
                </span>
                <span
                  className={cn(
                    "font-mono text-lg font-black leading-none",
                    edit.isEditing ? "text-bpim-success" : "text-bpim-primary",
                  )}
                >
                  {draftBpi != null ? draftBpi.toFixed(2) : "-"}
                </span>
                <span className="mt-1 text-[10px] font-bold text-bpim-primary/60">
                  {draftBpi != null
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
                  ? `MAX - ${maxScore - displayEx}`
                  : `${rankInfo.label} + ${rankInfo.surplus}`}
              </span>
              <span className="mt-1 text-[10px] font-bold text-bpim-danger/80">
                {rankInfo.label === "MAX-" ? "MAX" : rankInfo.nextLabel}まで{" "}
                {rankInfo.shortage}
              </span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={onTabChange} className="w-full">
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

            {displaySong && (
              <TabsContent value="stats" className="mt-0 outline-none">
                <StatsTab song={displaySong} />
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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongDetailModalView;
