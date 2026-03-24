"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/withScore";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { useUnplayedScores } from "@/hooks/table/useUnplayedScores";
import { NoDataAlert } from "../DashBoard/NoData";
import { SongDetailView } from "../Modal/BPIChart/SongDetails/ui";
import { CustomPagination } from "../Pagination/ui";
import { AdvancedFilterModal } from "../Songs/AdvancedFilter/ui";
import { SongFilterBar } from "../Songs/Filter/ui";
import { SongListSkeleton } from "../Table/skeleton";
import { SongList } from "../Table/table";

export const UnplayedSongsTable = ({
  userId,
  version,
}: {
  userId: string | undefined;
  version?: string;
}) => {
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { songs, error, isLoading } = useUnplayedScores(userId, version);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs);

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

  return (
    <div className="flex w-full min-h-svh flex-col p-0">
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
          defaultTab="definitions"
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
