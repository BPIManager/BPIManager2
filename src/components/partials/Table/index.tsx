"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/withScore";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { SongFilterBar } from "../Songs/Filter/ui";
import { SongList } from "./table";
import { CustomPagination } from "../Pagination/ui";
import { SongDetailView } from "../Modal/BPIChart/SongDetails/ui";
import { useUserScores } from "@/hooks/table/useUserScores";
import { NoDataAlert } from "../DashBoard/NoData";
import { SongListSkeleton } from "./skeleton";
import { AdvancedFilterModal } from "../Songs/AdvancedFilter/ui";

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

  const { songs, error, isLoading } = useUserScores(userId, version);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs);

  if (!isLoading && (error || !songs)) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2">
        <p className="font-bold text-red-500">楽曲データの取得に失敗しました</p>
        <p className="text-xs text-slate-500">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[100svh] flex-col p-0 bg-background">
      <SongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
        onOpenAdvancedFilter={() => setIsAdvancedOpen(true)}
      />

      {!isLoading && songs && songs.length === 0 && (
        <div className="p-4">
          <NoDataAlert />
        </div>
      )}

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <SongList
            songs={visibleSongs}
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

      <footer className="py-8 flex justify-center">
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
