"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { useArenaAveragesForSong } from "@/hooks/metrics/useArenaAveragesForSong";
import { useRivalScoresForSong } from "@/hooks/metrics/useRivalScoresForSong";
import { useAllScoreHistory } from "@/hooks/allScores/useAllScoresHistory";
import { BpiCalculator } from "@/lib/bpi";
import type { SongWithScore } from "@/types/songs/score";
import { StatsTabView } from "./ui";

export const StatsTab = ({ song }: { song: SongWithScore }) => {
  const router = useRouter();
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

  const { arenaAverages } = useArenaAveragesForSong(song.songId);
  const needsRivalData =
    selectedRef === "rival-avg" || selectedRef === "rival-top";
  const { rivalAvgScore, rivalTopScore } = useRivalScoresForSong(
    song.songId,
    needsRivalData,
  );
  const { historyGroups } = useAllScoreHistory(
    user?.userId,
    song.songId,
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
  }, [
    selectedRef,
    arenaAverages,
    rivalAvgScore,
    rivalTopScore,
    personalBest,
    router.query.version,
  ]);

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

  const chartData = useMemo(() => {
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

  return (
    <StatsTabView
      song={song}
      chartData={chartData}
      maxScore={song.notes * 2}
      refScore={refScore}
      refLabel={refLabel}
      selectedRef={selectedRef}
      onSelectedRefChange={setSelectedRef}
      arenaAverages={arenaAverages}
    />
  );
};
