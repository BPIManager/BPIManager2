"use client";

import { useSongListFilter } from "@/hooks/songs/useSongListFilter";
import { SongFilterControls, SongVirtualList } from "./ui";

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
    filteredSongs,
  } = useSongListFilter();

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
