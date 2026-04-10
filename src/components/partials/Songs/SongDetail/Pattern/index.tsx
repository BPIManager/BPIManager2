import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { List, type ListImperativeAPI } from "react-window";
import { useUser } from "@/contexts/users/UserContext";
import { useSongPatterns } from "@/hooks/songs/useSongPatterns";
import { API_PREFIX } from "@/constants/apiEndpoints";
import type { SongListItem } from "@/types/songs/songInfo";
import {
  PATTERN_ROW_HEIGHT,
  PatternListRow,
  PatternSearchBar,
  PatternTableHeader,
  type PatternRowProps,
  type PatternSearchResult,
} from "./ui";
import { PatternTabSkeleton } from "./skeleton";

interface PatternTabProps {
  songId: number;
  song: SongListItem;
}

function usePatternSearch(songId: number, input: string): PatternSearchResult {
  const isValid = input.length === 7 && /^\d{7}$/.test(input);

  const { data, isLoading } = useSWR<
    { score: number; rank: number; total: number } | null
  >(
    isValid
      ? `${API_PREFIX}/songs/${songId}/patterns/search?q=${input}`
      : null,
    async (url: string) => {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to search pattern");
      return res.json();
    },
    { revalidateOnFocus: false },
  );

  return useMemo(() => {
    if (!isValid) return { score: null, rank: null, total: null };
    if (isLoading || data === undefined)
      return { score: null, rank: null, total: null };
    if (!data) return { score: null, rank: null, total: null };
    return { score: data.score, rank: data.rank, total: data.total };
  }, [isValid, isLoading, data]);
}

export function PatternTab({ songId, song }: PatternTabProps) {
  const { fbUser } = useUser();
  const isLoggedIn = !!fbUser?.uid;

  const [sortBy, setSortBy] = useState<"score" | "upvote">("score");

  const { allItems, isLoading, hasMore, loadMore, vote, deleteVote } =
    useSongPatterns(songId, fbUser ?? null, sortBy);

  const [patternInput, setPatternInput] = useState("");
  const searchResult = usePatternSearch(songId, patternInput);

  const listRef = useRef<ListImperativeAPI>(null);

  const rowProps = useMemo<PatternRowProps>(
    () => ({
      items: allItems,
      song,
      onVote: vote,
      onDeleteVote: deleteVote,
      isLoggedIn,
      hasMore,
      onLoadMore: loadMore,
    }),
    [allItems, song, vote, deleteVote, isLoggedIn, hasMore, loadMore],
  );

  const handleInputChange = useCallback((v: string) => setPatternInput(v), []);

  if (isLoading) return <PatternTabSkeleton />;

  return (
    <div className="flex flex-col gap-3 mt-3">
      <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs text-blue-300 leading-relaxed">
        譜面傾向を分析し、BPIM独自の指標を用いて譜面全体を通して押しやすい配置が来るパターンをスコアリングして表示しています。
        <span className="font-semibold">本機能はベータ版のため、正確ではない可能性があります。</span>
        当たり譜面への投票もできます。
      </div>
      <PatternSearchBar
        value={patternInput}
        onChange={handleInputChange}
        result={searchResult}
      />

      {allItems.length > 0 ? (
        <div className="w-full overflow-hidden rounded-md border border-bpim-border">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-bpim-surface-2 border-b border-bpim-border">
            <span className="text-[10px] text-bpim-muted mr-1">並び替え:</span>
            {(["score", "upvote"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  sortBy === s
                    ? "border-bpim-text text-bpim-text"
                    : "border-bpim-border text-bpim-muted hover:text-bpim-text hover:border-bpim-text"
                }`}
              >
                {s === "score" ? "スコア" : "高評価数"}
              </button>
            ))}
          </div>
          <PatternTableHeader />
          <List
            listRef={listRef}
            rowCount={allItems.length + (hasMore ? 1 : 0)}
            rowHeight={PATTERN_ROW_HEIGHT}
            rowComponent={PatternListRow}
            rowProps={rowProps}
            style={{ height: "40svh" }}
            className="overscroll-contain custom-scrollbar"
          />
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-bpim-muted">
          データがありません
        </p>
      )}

      {!isLoggedIn && allItems.length > 0 && (
        <p className="text-center text-xs text-bpim-muted">
          投票するにはログインが必要です
        </p>
      )}
    </div>
  );
}
