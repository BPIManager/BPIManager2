"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/score";
import { useSongFilter } from "@/hooks/table/useSongFilter";
import { PAGE_SIZE } from "@/constants/logic/pagination";
import { useUnplayedScores } from "@/hooks/table/useUnplayedScores";
import { NoDataAlert } from "@/components/partials/common/DashBoard/NoData";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SongDetailView from "@/components/partials/modal/SongDetail/ui";
import CustomPagination from "@/components/partials/common/ListControls/Pagination/ui";
import AdvancedFilterModal from "@/components/partials/common/Songs/AdvancedFilter/ui";
import SongFilterBar from "@/components/partials/common/Songs/Filter/ui";
import SongListSkeleton from "@/components/partials/common/Table/skeleton";
import SongList from "@/components/partials/common/Table/ui";

const UnplayedSongsTable = ({
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

export default UnplayedSongsTable;
