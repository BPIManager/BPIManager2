"use client";

import { useState } from "react";
import { SongListSkeleton } from "@/components/partials/common/Table/skeleton";
import { CustomPagination } from "@/components/partials/common/ListControls/Pagination/ui";
import { AllSongWithScore } from "@/types/songs/allSongs";
import { AllSongFilterBar } from "./Filter";
import { AllSongList } from "./Table";
import { SongDetailView } from "@/components/partials/modal/SongDetail/ui";
import { FetchErrorState } from "@/components/partials/common/ErrorStates/FetchErrorState";
import {
  useAllSongsFilter,
  PAGE_SIZE,
} from "@/hooks/allScores/useAllSongsFilter";

export const AllSongsTable = ({ userId }: { userId: string | undefined }) => {
  const [selected, setSelected] = useState<AllSongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    params,
    updateParams,
    page,
    setPage,
    visibleSongs,
    totalCount,
    isLoading,
    error,
  } = useAllSongsFilter(userId);

  if (!isLoading && error) {
    return <FetchErrorState error={error} />;
  }

  return (
    <div className="flex w-full min-h-svh flex-col p-0">
      <AllSongFilterBar
        params={params}
        onParamsChange={updateParams}
        totalCount={totalCount}
      />

      <main className="flex-1">
        {isLoading ? (
          <SongListSkeleton />
        ) : (
          <AllSongList
            songs={visibleSongs}
            onSongSelect={(s) => {
              setSelected(s);
              setIsDetailOpen(true);
            }}
          />
        )}
      </main>

      <SongDetailView
        song={selected}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <CustomPagination
        count={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
};
