"use client";

import { useState } from "react";
import { SongListSkeleton } from "../Table/skeleton";
import { CustomPagination } from "../Pagination/ui";
import { AllSongWithScore } from "@/types/songs/allSongs";
import { AllSongFilterBar } from "./Filter";
import { AllSongList } from "./Table";
import { AllSongDetailModal } from "./Modal";
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
    return (
      <div className="flex h-50 flex-col items-center justify-center gap-2">
        <p className="font-bold text-bpim-danger">
          楽曲データの取得に失敗しました
        </p>
      </div>
    );
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

      <AllSongDetailModal
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
