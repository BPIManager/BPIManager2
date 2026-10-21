"use client";

import { useMemo } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useScoreHistory } from "@/hooks/scores/useScoreLogs";
import { useAllScoreHistory } from "@/hooks/allScores/useAllScoresHistory";
import { SectionLoader } from "@/components/ui/loading-spinner";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SongHistoryView from "./ui";

interface SongHistoryTabProps {
  songId: number;
  /** 履歴を取得するユーザー。未指定ならログイン中の自分 */
  userId?: string;
  /** 全難易度スコア(BPI未計算)の場合に notes を渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
  maxScore: number;
}

const SongHistoryTab = ({
  songId,
  userId,
  notes,
  maxScore,
}: SongHistoryTabProps) => {
  const { fbUser } = useUser();
  const targetUserId = userId ?? fbUser?.uid;
  const isAllScores = notes != null;

  const {
    historyGroups: mainHistory,
    isLoading: mainLoading,
    isError: mainError,
  } = useScoreHistory(isAllScores ? undefined : targetUserId, songId);
  const {
    historyGroups: allHistory,
    isLoading: allLoading,
    isError: allError,
  } = useAllScoreHistory(targetUserId, songId, isAllScores);

  const historyGroups = isAllScores ? allHistory : mainHistory;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const isError = isAllScores ? allError : mainError;

  const globalMaxScore = useMemo(() => {
    if (!historyGroups) return 0;
    return Math.max(
      ...Object.values(historyGroups)
        .flat()
        .map((s) => s.exScore ?? 0),
    );
  }, [historyGroups]);

  if (isLoading) return <SectionLoader className="h-64" />;

  if (isError) return <FetchErrorState error={isError} className="min-h-64" />;

  return (
    <SongHistoryView
      historyGroups={historyGroups}
      globalMaxScore={globalMaxScore}
      notes={notes}
      maxScore={maxScore}
    />
  );
};

export default SongHistoryTab;
