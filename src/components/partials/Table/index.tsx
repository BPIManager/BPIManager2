"use client";

import { useState, useMemo } from "react";
import { SongWithScore } from "@/types/songs/withScore";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { SongFilterBar } from "../Songs/Filter/ui";
import { SongList } from "./ui";
import { CustomPagination } from "../Pagination/ui";
import { SongDetailView } from "../Modal/BPIChart/SongDetails/ui";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useCompareScores } from "@/hooks/table/useCompareScores";
import { NoDataAlert } from "../DashBoard/NoData/ui";
import { SongListSkeleton } from "./skeleton";
import { AdvancedFilterModal } from "../Songs/AdvancedFilter/ui";
import { Loader } from "lucide-react";

export const SongsTable = ({
  userId,
  version,
}: {
  userId: string | undefined;
  version?: string;
}) => {
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { songs, error, isLoading, currentVersion } = useUserScores(
    userId,
    version,
  );

  const {
    params,
    updateParams,
    page,
    setPage,
    totalCount,
    totalPages,
    visibleSongs: rawVisible,
  } = useSongFilter(songs);

  const { compareData, isCompareLoading } = useCompareScores(
    userId,
    currentVersion,
    params.compareVersion,
  );

  const mergedSongs = useMemo(() => {
    if (
      !songs ||
      !compareData ||
      !params.compareVersion ||
      params.compareVersion === "none"
    ) {
      return songs;
    }
    const compareMap = new Map(
      compareData.map((s) => [`${s.songId}-${s.difficulty}`, s]),
    );
    return songs.map((song) => {
      const key = `${song.songId}-${song.difficulty}`;
      const cmp = compareMap.get(key);
      if (!cmp) return song;
      const prevEx = cmp.rival?.exScore ?? null;
      const prevBpi = cmp.rival?.bpi ?? null;
      return {
        ...song,
        rival: cmp.rival ?? null,
        exDiff:
          song.exScore !== null && prevEx !== null
            ? song.exScore - prevEx
            : undefined,
        bpiDiff:
          song.bpi !== null && prevBpi !== null
            ? Math.round((song.bpi - prevBpi) * 100) / 100
            : undefined,
      };
    });
  }, [songs, compareData, params.compareVersion]);

  const mergedVisible = useMemo(() => {
    if (!mergedSongs) return rawVisible;
    const mergedMap = new Map(
      mergedSongs.map((s) => [`${s.songId}-${s.difficulty}`, s]),
    );
    return rawVisible.map(
      (s) => mergedMap.get(`${s.songId}-${s.difficulty}`) ?? s,
    );
  }, [rawVisible, mergedSongs]);

  if (!isLoading && (error || !songs)) {
    return (
      <div className="flex h-50 flex-col items-center justify-center gap-2">
        <p className="font-bold text-bpim-danger">
          楽曲データの取得に失敗しました
        </p>
        <p className="text-xs text-bpim-muted">{error?.message}</p>
      </div>
    );
  }

  const showCompareLoading =
    isCompareLoading &&
    params.compareVersion &&
    params.compareVersion !== "none";

  return (
    <div className="flex w-full min-h-svh flex-col p-0">
      <SongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
        withSelfCompare
        currentVersion={currentVersion}
      />

      {!isLoading && songs && songs.length === 0 && (
        <div className="p-4">
          <NoDataAlert />
        </div>
      )}

      {showCompareLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-bpim-muted border-b border-bpim-border">
          <Loader className="h-3 w-3 animate-spin" />
          前作データを読み込み中...
        </div>
      )}

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <SongList
            songs={mergedVisible}
            compareVersion={params.compareVersion}
            onSongSelect={(song) => {
              setSelectedSong(song);
              setIsDetailOpen(true);
            }}
          />
        )}
      </main>

      <AdvancedFilterModal
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        params={params}
        onParamsChange={updateParams}
      />

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      <footer className="py-2">
        <CustomPagination
          count={totalCount}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
        />
      </footer>
    </div>
  );
};
