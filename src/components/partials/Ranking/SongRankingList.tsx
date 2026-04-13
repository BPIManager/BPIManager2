"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useUserSongRankings } from "@/hooks/stats/useUserSongRankings";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SongRankEntry } from "@/types/users/ranking";
import type { AllSongWithScore, AllDifficulties } from "@/types/songs/allSongs";
import { AllSongDetailModal } from "@/components/partials/AllSongs/Modal";
import { ALL_LEVELS } from "@/constants/levels";
import { Search } from "lucide-react";

type SortKey =
  | "pct_asc"
  | "pct_desc"
  | "rank_asc"
  | "rank_desc"
  | "title"
  | "updated";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "pct_asc", label: "上位%が高い順" },
  { value: "pct_desc", label: "上位%が低い順" },
  { value: "rank_asc", label: "順位が高い順" },
  { value: "rank_desc", label: "順位が低い順" },
  { value: "title", label: "楽曲名順" },
  { value: "updated", label: "最近更新した順" },
];

function pct(entry: SongRankEntry): number {
  return entry.totalPlayers > 0 ? (entry.rank / entry.totalPlayers) * 100 : 100;
}

function sortSongs(songs: SongRankEntry[], sort: SortKey): SongRankEntry[] {
  const copy = [...songs];
  switch (sort) {
    case "pct_asc":
      return copy.sort((a, b) => pct(a) - pct(b));
    case "pct_desc":
      return copy.sort((a, b) => pct(b) - pct(a));
    case "rank_asc":
      return copy.sort((a, b) => a.rank - b.rank);
    case "rank_desc":
      return copy.sort((a, b) => b.rank - a.rank);
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "ja"));
    case "updated":
      return copy.sort(
        (a, b) =>
          new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime(),
      );
  }
}

function getPctColor(p: number): { text: string; border: string; bg: string } {
  if (p <= 5) return { text: "#facc15", border: "#facc15", bg: "#facc1522" }; // gold
  if (p <= 15) return { text: "#60a5fa", border: "#60a5fa", bg: "#60a5fa22" }; // blue
  if (p <= 35) return { text: "#4ade80", border: "#4ade80", bg: "#4ade8022" }; // green
  if (p <= 60) return { text: "#94a3b8", border: "#94a3b8", bg: "#94a3b822" }; // slate
  return { text: "#f87171", border: "#f87171", bg: "#f8717122" }; // red
}

function toAllSongWithScore(entry: SongRankEntry): AllSongWithScore {
  return {
    songId: entry.songId,
    title: entry.title,
    notes: entry.notes,
    bpm: entry.bpm,
    difficulty: entry.difficulty as AllDifficulties,
    difficultyLevel: entry.difficultyLevel,
    releasedVersion: entry.releasedVersion
      ? Number(entry.releasedVersion)
      : null,
    logId: entry.logId,
    exScore: entry.exScore,
    clearState: entry.clearState,
    missCount: entry.missCount,
    lastPlayed: entry.lastPlayed,
  };
}

interface SongRankRowProps {
  entry: SongRankEntry;
  onClick: () => void;
}

const SongRankRow = ({ entry, onClick }: SongRankRowProps) => {
  const p = pct(entry);
  const pctColor = getPctColor(p);

  return (
    <button type="button" className="w-full text-left" onClick={onClick}>
      <div className="flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/40 px-3 py-2.5 hover:bg-bpim-overlay/50 transition-colors">
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-bpim-text">
            {entry.title}
          </span>
          <span className="text-[10px] text-bpim-muted">
            ☆{entry.difficultyLevel} {entry.difficulty}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] text-bpim-muted whitespace-nowrap">
            <b className="text-bpim-text">{entry.rank}位</b> /{" "}
            {entry.totalPlayers}人中
          </span>
          <div
            className="inline-flex min-w-[60px] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-xs font-bold"
            style={{
              borderColor: pctColor.border,
              backgroundColor: pctColor.bg,
              color: pctColor.text,
            }}
          >
            上位{p.toFixed(1)}%
          </div>
        </div>
      </div>
    </button>
  );
};

interface SongRankingListProps {
  version: string;
}

export const SongRankingList = ({ version }: SongRankingListProps) => {
  const { data, isLoading } = useUserSongRankings(version);
  const [sort, setSort] = useState<SortKey>("pct_asc");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<AllSongWithScore | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDebouncedQuery(value);
      }, 300);
    },
    [],
  );

  const handleRowClick = useCallback((entry: SongRankEntry) => {
    setSelectedSong(toAllSongWithScore(entry));
    setIsModalOpen(true);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let songs = data.songs;

    if (levelFilter !== "all") {
      const level = Number(levelFilter);
      songs = songs.filter((s) => s.difficultyLevel === level);
    }

    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      songs = songs.filter((s) => s.title.toLowerCase().includes(q));
    }

    return sortSongs(songs, sort);
  }, [data, sort, levelFilter, debouncedQuery]);

  if (isLoading) {
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex flex-col gap-1" style={{ minWidth: 90 }}>
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              Level
            </label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                <SelectItem value="all">すべて</SelectItem>
                {ALL_LEVELS.map((lv) => (
                  <SelectItem key={lv} value={String(lv)}>
                    ☆{lv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              Sort
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full h-9 border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-bpim-muted pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="楽曲名で検索"
                className="h-9 pl-8 border-bpim-border bg-bpim-bg text-bpim-text placeholder:text-bpim-muted focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              楽曲名
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase whitespace-nowrap">
              順位
            </span>
            <span className="inline-flex min-w-[60px] items-center justify-center text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              上位%
            </span>
          </div>
        </div>

        <div
          className="overflow-y-auto flex flex-col gap-1"
          style={{ height: "calc(100svh - 440px)", minHeight: "300px" }}
        >
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-bpim-muted">
              {debouncedQuery || levelFilter !== "all"
                ? "該当する楽曲がありません"
                : "データがありません"}
            </div>
          ) : (
            filtered.map((entry) => (
              <SongRankRow
                key={`${entry.songId}-${entry.difficulty}`}
                entry={entry}
                onClick={() => handleRowClick(entry)}
              />
            ))
          )}
        </div>
      </div>

      <AllSongDetailModal
        song={selectedSong}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
