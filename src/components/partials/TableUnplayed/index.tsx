"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/score";
import { useSongFilter, PAGE_SIZE } from "@/hooks/table/useSongFilter";
import { useUnplayedScores } from "@/hooks/table/useUnplayedScores";
import { NoDataAlert } from "../DashBoard/NoData";
import { FetchErrorState } from "../FetchErrorState";
import { SongDetailView } from "../Modal/SongDetail/ui";
import { CustomPagination } from "../Pagination/ui";
import { AdvancedFilterModal } from "../Songs/AdvancedFilter/ui";
import { SongFilterBar } from "../Songs/Filter/ui";
import { SongListSkeleton } from "../Table/skeleton";
import { SongList } from "../Table/ui";

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
    return <FetchErrorState error={error} />;
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

      <CustomPagination
        count={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
};
