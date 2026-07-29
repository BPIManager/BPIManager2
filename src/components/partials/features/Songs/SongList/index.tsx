"use client";

import { useSongListFilter } from "@/hooks/songs/useSongListFilter";
import { SongFilterControls, SongVirtualList } from "./ui";
import { FetchErrorState } from "@/components/partials/common/ErrorStates/FetchErrorState";

export function SongListContent() {
  const {
    localSearch,
    setLocalSearch,
    difficulties,
    toggleDifficulty,
    sortKey,
    sortDir,
    handleSortClick,
    isLoading,
    isError,
    filteredSongs,
  } = useSongListFilter();

  if (isError) {
    return <FetchErrorState error={isError} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SongFilterControls
        localSearch={localSearch}
        onSearchChange={setLocalSearch}
        difficulties={difficulties}
        onToggleDifficulty={toggleDifficulty}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortClick={handleSortClick}
      />

      <p className="text-xs text-bpim-muted">
        {isLoading ? "読み込み中..." : `${filteredSongs.length} 曲`}
      </p>

      <SongVirtualList
        songs={filteredSongs}
        isLoading={isLoading}
        sortKey={sortKey}
      />
    </div>
  );
}
