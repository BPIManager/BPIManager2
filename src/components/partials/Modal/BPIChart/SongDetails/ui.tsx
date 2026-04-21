"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, LucideHistory, Users, DatabaseSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { SongWithScore } from "@/types/songs/score";
import { BpiCalculator } from "@/lib/bpi";
import { BPIChart } from "./chart";
import { getRankDetail } from "@/constants/djRank";
import { SongHistoryTab } from "../History/ui";
import RivalsRanking from "../Rivals";
import { AppTabsList, AppTabsTrigger } from "@/components/ui/complex/tabs";
import { DefinitionsTab } from "../Definitions/ui";
import { useArenaAveragesForSong } from "@/hooks/metrics/useArenaAveragesForSong";
import { useRivalScoresForSong } from "@/hooks/metrics/useRivalScoresForSong";
import { useAllScoreHistory } from "@/hooks/allScores/useAllScoresHistory";
import { useUser } from "@/contexts/users/UserContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "@/lib/dayjs";
import { useRouter } from "next/router";

interface SongDetailViewProps {
  song: SongWithScore | null;
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
  const router = useRouter();
  const [tab, setTab] = useState<string>(defaultTab || "stats");
  const tabs = [
    { value: "stats", label: "Statistics", icon: LineChart },
    { value: "history", label: "History", icon: LucideHistory },
    { value: "rivals", label: "Rivals", icon: Users },
    { value: "definitions", label: "Definitions", icon: DatabaseSearch },
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

  const { user } = useUser();

  const [selectedRef, setSelectedRef] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("bpim_arena_rank_select") ?? "";
  });

  useEffect(() => {
    if (selectedRef) {
      localStorage.setItem("bpim_arena_rank_select", selectedRef);
    }
  }, [selectedRef]);

  useEffect(() => {
    if (user?.arenaRank && !selectedRef) {
      setSelectedRef(user.arenaRank);
    }
  }, [user?.arenaRank, selectedRef]);

  const { arenaAverages } = useArenaAveragesForSong(song?.songId || -1);
  const needsRivalData =
    selectedRef === "rival-avg" || selectedRef === "rival-top";
  const { rivalAvgScore, rivalTopScore } = useRivalScoresForSong(
    song?.songId ?? null,
    needsRivalData,
  );
  const { historyGroups } = useAllScoreHistory(
    user?.userId,
    song?.songId ?? null,
    selectedRef === "personal-best",
  );

  const personalBest = useMemo(() => {
    if (!historyGroups) return null;
    let bestScore = 0;
    let bestVersion = "";
    for (const [version, scores] of Object.entries(historyGroups)) {
      for (const s of scores) {
        if (s.exScore != null && s.exScore > bestScore) {
          bestScore = s.exScore;
          bestVersion = version;
        }
      }
    }
    return bestScore > 0 ? { score: bestScore, version: bestVersion } : null;
  }, [historyGroups]);

  const refScore = useMemo(() => {
    if (!selectedRef || selectedRef === "none") return undefined;
    if (selectedRef === "rival-avg") return rivalAvgScore ?? undefined;
    if (selectedRef === "rival-top") return rivalTopScore ?? undefined;
    if (selectedRef === "personal-best")
      return personalBest?.version !== router.query.version
        ? (personalBest?.score ?? undefined)
        : undefined;
    if (!arenaAverages) return undefined;
    const raw = arenaAverages[selectedRef]?.avgExScore;
    return raw != null ? Math.round(raw) : undefined;
  }, [selectedRef, arenaAverages, rivalAvgScore, rivalTopScore, personalBest]);

  const refLabel = useMemo(() => {
    if (!selectedRef || selectedRef === "none") return undefined;
    if (selectedRef === "rival-avg") return "ライバル平均";
    if (selectedRef === "rival-top") return "ライバルトップ";
    if (selectedRef === "personal-best")
      return personalBest
        ? `自己歴代(IIDX ${personalBest.version})`
        : "自己歴代";
    return selectedRef + "平均";
  }, [selectedRef, personalBest]);

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
            <AppTabsList visual="card" cols={4}>
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

            <TabsContent value="stats" className="mt-0 outline-none">
              <div className="flex items-center justify-end px-1 gap-2 pt-2">
                <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                  比較
                </span>
                <Select value={selectedRef} onValueChange={setSelectedRef}>
                  <SelectTrigger className="h-6 w-30 text-[10px] px-2 py-0">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      className="text-xs text-bpim-muted"
                    >
                      非表示
                    </SelectItem>
                    {["A1", "A2", "A3", "A4", "A5"].map((rank) => (
                      <SelectItem
                        key={rank}
                        value={rank}
                        className="text-xs"
                        disabled={!arenaAverages}
                      >
                        {rank}平均
                      </SelectItem>
                    ))}
                    <SelectItem value="rival-avg" className="text-xs">
                      ライバル平均
                    </SelectItem>
                    <SelectItem value="rival-top" className="text-xs">
                      ライバルトップ
                    </SelectItem>
                    <SelectItem value="personal-best" className="text-xs">
                      自己歴代
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <BPIChart
                key={song.songId}
                data={chartData}
                maxScore={maxScore}
                song={song}
                refScore={refScore}
                refLabel={refLabel}
              />

              <div className="mt-4 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      Notes / Max
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.notes} / {song.notes * 2}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      WR
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.wrScore ?? 0}
                      <span className="text-bpim-muted">
                        {" / "}
                        {Number(
                          ((song.wrScore ?? 0) / (song.notes * 2)) * 100,
                        ).toFixed(2)}{" "}
                        %
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      スコア平均
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.kaidenAvg ?? 0}
                      <span className="text-bpim-muted">
                        {" / "}
                        {Number(
                          ((song.kaidenAvg ?? 0) / (song.notes * 2)) * 100,
                        ).toFixed(2)}{" "}
                        %
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      譜面係数
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.coef ?? -1}
                    </span>
                  </div>
                  <Separator className="my-1 bg-bpim-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      クリアランプ
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-text">
                      {song.clearState || "NO PLAY"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-bpim-muted uppercase">
                      BP
                    </span>
                    <span className="font-mono text-sm font-black text-bpim-danger">
                      {song.missCount ?? "-"}
                    </span>
                  </div>
                  {song.scoreAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-bpim-muted uppercase">
                        最終更新
                      </span>
                      <span className="font-mono text-sm font-black">
                        {dayjs(song.scoreAt).format("YYYY/MM/DD HH:mm")} (
                        {dayjs(song.scoreAt).fromNow()})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 outline-none">
              <SongHistoryTab songId={song.songId} />
            </TabsContent>

            <TabsContent value="rivals" className="mt-0 outline-none">
              <RivalsRanking song={song} />
            </TabsContent>

            <TabsContent value="definitions" className="mt-0 outline-none">
              <DefinitionsTab song={song} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
