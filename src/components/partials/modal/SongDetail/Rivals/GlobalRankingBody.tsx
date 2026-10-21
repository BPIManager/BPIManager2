import { useEffect, useMemo, useRef } from "react";
import type { ListImperativeAPI } from "react-window";
import { useSongRanking } from "@/hooks/stats/useSongRanking";
import { useAllSongRanking } from "@/hooks/allScores/useAllSongRanking";
import { SectionLoader } from "@/components/ui/loading-spinner";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { withCompareTargets } from "@/utils/songs/rankingRows";
import { GlobalRankingView } from "./ui";
import type { RankingBodyProps } from "./types";

export default function GlobalRankingBody({
  version,
  songId,
  song,
  notes,
  onNavigate,
  highlightUserId,
  compareTargets,
}: RankingBodyProps) {
  const isAllScores = notes != null;
  const {
    data: mainData,
    isLoading: mainLoading,
    isError: mainError,
  } = useSongRanking(isAllScores ? null : songId, version);
  const {
    data: allData,
    isLoading: allLoading,
    isError: allError,
  } = useAllSongRanking(isAllScores ? songId : null, version);
  const data = isAllScores ? allData : mainData;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const isError = isAllScores ? allError : mainError;
  const rankings = useMemo(
    () =>
      data ? withCompareTargets(data.rankings, compareTargets ?? [], song) : [],
    [data, compareTargets, song],
  );
  const listRef = useRef<ListImperativeAPI>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    hasScrolled.current = false;
  }, [songId, version, isAllScores]);

  useEffect(() => {
    if (!data || !listRef.current || hasScrolled.current) return;
    const focusIndex = rankings.findIndex((r) =>
      highlightUserId ? r.userId === highlightUserId : r.isSelf,
    );
    if (focusIndex < 0) return;
    hasScrolled.current = true;
    const timer = setTimeout(() => {
      listRef.current?.scrollToRow({ align: "center", index: focusIndex });
    }, 50);
    return () => clearTimeout(timer);
  }, [data, rankings, songId, version, isAllScores, highlightUserId]);

  if (isLoading) {
    return <SectionLoader className="py-8" color="text-bpim-info" />;
  }
  if (isError) {
    return <FetchErrorState error={isError} className="min-h-64" />;
  }
  if (!data) return null;

  const highlighted = highlightUserId
    ? rankings.find((r) => r.userId === highlightUserId)
    : undefined;

  return (
    <GlobalRankingView
      rankings={rankings}
      listRef={listRef}
      onNavigate={onNavigate}
      highlightUserId={highlightUserId}
      notes={notes}
      totalCount={data.totalCount}
      displayRank={highlighted ? highlighted.rank : data.selfRank}
      highlightedName={highlighted?.userName}
    />
  );
}
