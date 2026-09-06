import { useState } from "react";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { useInfiniteListV2 } from "@/services/swr/useInfinite";

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

  const { items, isLoading, isLoadingMore, isReachingEnd, isError, setSize } =
    useInfiniteListV2<RecentNote[], RecentNote>(
      (index) => `${API_V2_PREFIX}/songs/notes/recent?sort=${sort}&page=${index}`,
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
    isError,
    setSize,
    sort,
    setSort: handleSetSort,
  };
}
