"use client";

import { useState } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { useRivalBothScores } from "@/hooks/social/useRivalAllScores";
import { SongWithRival, SongWithScore } from "@/types/songs/score";

import { SongFilterBar } from "@/components/partials/Songs/Filter/ui";
import { SongListSkeleton } from "@/components/partials/Table/skeleton";
import { NoDataAlert } from "@/components/partials/DashBoard/NoData/ui";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { CustomPagination } from "@/components/partials/Pagination/ui";
import { AdvancedFilterModal } from "@/components/partials/Songs/AdvancedFilter/ui";
import { SongDetailView } from "@/components/partials/Modal/BPIChart/SongDetails/ui";
import { RivalSongItem } from "./ui";

export const RivalSongsTable = ({
  myUserId,
  rivalUserId,
  version,
}: {
  myUserId: string | undefined;
  rivalUserId: string | undefined;
  version?: string;
}) => {
  const { fbUser } = useUser();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { songs, error, isLoading } = useRivalBothScores(
    myUserId,
    rivalUserId,
    version,
  );

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs);

  if (!fbUser) return <LoginRequiredCard />;

  if (!isLoading && (error || !songs)) {
    return (
      <div className="flex h-50 flex-col items-center justify-center gap-2">
        <p className="font-bold text-bpim-danger">楽曲データの取得に失敗しました</p>
        <p className="text-xs text-bpim-muted">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-h-svh flex flex-col bg-background">
      <SongFilterBar
        withRivals="full"
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
          <div className="w-full p-2 flex flex-col">
            {visibleSongs.map((song) => {
              const s = song as SongWithRival;
              return (
                <RivalSongItem
                  key={`${s.songId}-${s.difficulty}`}
                  song={s}
                  onClick={() => {
                    setSelectedSong(s);
                    setIsDetailOpen(true);
                  }}
                />
              );
            })}
          </div>
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
