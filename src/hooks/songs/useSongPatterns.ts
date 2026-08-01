import useSWRInfinite from "swr/infinite";
import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import type { VoteType } from "@/types/db";

export interface SongPatternItem {
  pattern: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  myVote: VoteType | null;
}

export interface PatternsPage {
  items: SongPatternItem[];
  nextCursor: number | null;
}

export function useSongPatterns(
  songId: number,
  fbUser: FirebaseUser | null,
  sortBy: "score" | "upvote" = "score",
) {
  const getKey = (
    _pageIndex: number,
    previousPageData: PatternsPage | null,
  ): [string, string | null] | null => {
    if (previousPageData && previousPageData.nextCursor === null) return null;
    const cursor = previousPageData?.nextCursor ?? 0;
    const url = `${API_PREFIX}/songs/${songId}/patterns?cursor=${cursor}&sortBy=${sortBy}`;
    // キャッシュキーにはFirebase Userオブジェクト全体でなくuidのみを使う
    return [url, fbUser?.uid ?? null];
  };

  const { data, isLoading, size, setSize, mutate } =
    useSWRInfinite<PatternsPage>(
      getKey,
      async ([url]: [string, string | null]) => {
        const token = fbUser ? await fbUser.getIdToken() : null;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch patterns");
        return res.json();
      },
      { revalidateOnFocus: false },
    );

  const allItems: SongPatternItem[] = data?.flatMap((p) => p.items) ?? [];
  const lastPage = data?.[data.length - 1];
  const hasMore =
    lastPage !== undefined && lastPage.nextCursor !== null;
  const isLoadingMore = size > (data?.length ?? 0);

  async function vote(pattern: string, voteType: VoteType): Promise<void> {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_PREFIX}/songs/${songId}/patterns/${pattern}/vote`,
      "POST",
      fbUser,
      { voteType },
    );
    if (!res.ok) throw new Error("Failed to vote pattern");
    await mutate();
  }

  async function deleteVote(pattern: string): Promise<void> {
    if (!fbUser) return;
    const res = await authFetch(
      `${API_PREFIX}/songs/${songId}/patterns/${pattern}/vote`,
      "DELETE",
      fbUser,
    );
    if (!res.ok) throw new Error("Failed to delete pattern vote");
    await mutate();
  }

  return {
    allItems,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore: () => setSize(size + 1),
    vote,
    deleteVote,
  };
}
