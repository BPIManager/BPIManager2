"use client";

import { useState } from "react";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { SongWithRival, SongWithScore } from "@/types/songs/score";

import { SongFilterBar } from "@/components/partials/Songs/Filter/ui";
import { SongListSkeleton } from "@/components/partials/Table/skeleton";
import { NoDataAlert } from "@/components/partials/DashBoard/NoData/ui";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";
import { CustomPagination } from "@/components/partials/Pagination/ui";
import { AdvancedFilterModal } from "@/components/partials/Songs/AdvancedFilter/ui";
import { SongDetailView } from "@/components/partials/Modal/BPIChart/SongDetails/ui";
import { RivalSongItem } from "@/components/partials/Rivals/Table/ui";
import { useUser } from "@/contexts/users/UserContext";
import type { AnalyticsTarget } from "@/types/analytics";

interface AnalyticsComparisonTableProps {
  songs: SongWithRival[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  rivalLabel?: string;
  target: AnalyticsTarget | null;
}

export const AnalyticsComparisonTable = ({
  songs,
  isLoading,
  error,
  rivalLabel,
  target,
}: AnalyticsComparisonTableProps) => {
  const { fbUser } = useUser();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { params, updateParams, page, setPage, visibleSongs, totalCount } =
    useSongFilter(songs, { isMyPlayed: true, isRivalPlayed: true });

  if (!fbUser) return <LoginRequiredCard />;

  if (!isLoading && error) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2">
        <p className="font-bold text-bpim-danger">
          楽曲データの取得に失敗しました
        </p>
        <p className="text-xs text-bpim-muted">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-h-[100svh] flex flex-col bg-background">
      {rivalLabel && !isLoading && songs && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-bpim-warning">
            vs {rivalLabel}
          </span>
        </div>
      )}

      <SongFilterBar
        withRivals={"full"}
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

      <CustomPagination
        count={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
};
