"use client";

import { useMemo, useState } from "react";
import { LineChart, LucideHistory, Users, PencilIcon, XIcon } from "lucide-react";
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
import { hasBpiData } from "@/utils/songs/songDetailMode";
import { BpiCalculator } from "@/lib/bpi";
import { getRankDetail } from "@/constants/iidx/rankBorders";
import { useUser } from "@/contexts/users/UserContext";
import { useManualScoreUpdate } from "@/hooks/scores/useManualScoreUpdate";
import SongHistoryTab from "./History/ui";
import RivalsRanking from "./Rivals";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import StatsTab from "./Stats";

interface SongDetailViewProps {
  song: SongDetailSubject | null;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "stats" | "history" | "rivals";
  /** EXスコアの手動編集を有効にする場合、対象ユーザーIDとバージョンを渡す */
  userId?: string;
  version?: string;
  /**
   * `song.songId`がどちらの楽曲ドメイン由来か。`songs`/`songDef`ドメイン
   * （BPI計算対象、☆11/12）は`"bpi"`、`allSongs`ドメイン（全難易度、
   * ☆1-12）は`"allSongs"`を渡す。両ドメインで`songId`の値が異なるため、
   * 手動編集を有効にするにはこの指定が必須。
   */
  songDomain?: "bpi" | "allSongs";
  /** 手動保存が成功した際に呼ばれる（呼び出し元でのデータ再取得等に使う） */
  onSaved?: () => void;
}

const SongDetailView = ({
  song,
  isOpen,
  onClose,
  defaultTab,
  userId,
  version,
  songDomain,
  onSaved,
}: SongDetailViewProps) => {
  // 全難易度スコア(BPI未計算)にはStatisticsタブを表示しない
  const fullSong = song && hasBpiData(song) ? song : null;
  const [tab, setTab] = useState<string>(
    defaultTab || (fullSong ? "stats" : "history"),
  );
  const tabs = fullSong
    ? [
        { value: "stats", label: "Statistics", icon: LineChart },
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
      ]
    : [
        { value: "history", label: "History", icon: LucideHistory },
        { value: "rivals", label: "Rivals", icon: Users },
      ];

  const { fbUser } = useUser();
  const { save, isSaving } = useManualScoreUpdate(userId ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [draftExScore, setDraftExScore] = useState<number | null>(null);

  // 手動編集を許可するのは、呼び出し元がsongDomainを指定しており
  // （☆10以下の全難易度曲も編集対象になり得るため`fullSong`は問わない）、
  // 自分自身のプロフィールを見ている場合のみ
  const canEdit =
    !!userId && !!version && !!songDomain && fbUser?.uid === userId;

  const maxScore = song ? song.notes * 2 : 0;
  const currentEx = song ? song.exScore || 0 : 0;
  const displayEx = isEditing && draftExScore != null ? draftExScore : currentEx;

  const rankInfo = useMemo(
    () => getRankDetail(displayEx, maxScore),
    [displayEx, maxScore],
  );

  const draftBpi = useMemo(() => {
    if (!fullSong || !isEditing || draftExScore == null) return fullSong?.bpi ?? null;
    return BpiCalculator.calc(draftExScore, fullSong);
  }, [fullSong, isEditing, draftExScore]);

  const bpiInfo = useMemo(() => {
    if (!fullSong) return { next: 0 as number | string, diff: 0 };
    if (draftBpi == null) return { next: "-", diff: 0 };
    const nextTargetBpi = Math.ceil((draftBpi + 0.01) / 10) * 10;
    const targetScore = BpiCalculator.calcFromBPI(nextTargetBpi, fullSong, true);
    if (targetScore === null) return { next: "-", diff: 0 };
    return { next: nextTargetBpi, diff: targetScore - displayEx };
  }, [fullSong, draftBpi, displayEx]);

  const startEditing = () => {
    if (!canEdit) return;
    setDraftExScore(currentEx);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftExScore(null);
  };

  const canSave =
    isEditing &&
    draftExScore != null &&
    draftExScore > currentEx &&
    draftExScore <= maxScore;

  const handleSave = async () => {
    if (!canSave || !song || !version || !songDomain || draftExScore == null) return;
    const result = await save({
      songId: song.songId,
      songDomain,
      version,
      exScore: draftExScore,
    });
    if (result) {
      setIsEditing(false);
      setDraftExScore(null);
      onSaved?.();
    }
  };

  if (!song) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          cancelEditing();
          onClose();
        }
      }}
    >
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
          {isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-bpim-muted hover:text-bpim-text"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 bg-bpim-primary px-4 font-bold hover:bg-bpim-primary"
                onClick={handleSave}
                disabled={!canSave || isSaving}
              >
                {isSaving ? <LoadingSpinner size="sm" /> : "保存"}
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-col overflow-y-auto p-2 custom-scrollbar">
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                EX Score
                {canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="text-bpim-muted hover:text-bpim-primary"
                    aria-label="EXスコアを編集"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </button>
                )}
              </span>
              {isEditing ? (
                <Input
                  type="number"
                  autoFocus
                  min={0}
                  max={maxScore}
                  value={draftExScore ?? ""}
                  onChange={(e) =>
                    setDraftExScore(e.target.value ? Number(e.target.value) : null)
                  }
                  className="h-8 font-mono text-lg font-black"
                />
              ) : (
                <span
                  className={cn(
                    "font-mono text-lg font-black text-bpim-text leading-none",
                    canEdit && "cursor-pointer hover:text-bpim-primary",
                  )}
                  onClick={startEditing}
                >
                  {song.exScore ?? 0}
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
                    isEditing ? "text-bpim-success" : "text-bpim-primary",
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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SongDetailView;
