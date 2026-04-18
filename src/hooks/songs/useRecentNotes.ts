import { useState } from "react";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { useInfiniteList } from "@/services/swr/useInfinite";

export interface RecentNote {
  id: number;
  songId: number;
  songTitle: string;
  difficulty: string;
  difficultyLevel: number;
  body: string;
  authorTotalBpi: number | null;
  upvoteCount: number;
  createdAt: string;
}

export type RecentNoteSort = "latest" | "upvotes";

const PAGE_SIZE = 20;

export function useRecentNotes() {
  const [sort, setSort] = useState<RecentNoteSort>("latest");

  const { items, isLoading, isLoadingMore, isReachingEnd, setSize } =
    useInfiniteList<RecentNote[], RecentNote>(
      (index) => `${API_PREFIX}/songs/notes/recent?sort=${sort}&page=${index}`,
      {
        getItems: (page) => page,
        isLastPage: (page) => page.length < PAGE_SIZE,
        revalidateOnFocus: false,
      },
    );

  function handleSetSort(next: RecentNoteSort) {
    setSort(next);
    setSize(1);
  }

  return {
    notes: items,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    setSize,
    sort,
    setSort: handleSetSort,
  };
}
