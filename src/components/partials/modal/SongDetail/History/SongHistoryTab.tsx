"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useUser } from "@/contexts/users/UserContext";
import { saveUseOption } from "@/services/swr/scores/useOption";
import type { SongHistoryResponse } from "@/types/songs/score";
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
    mutate: mutateMain,
  } = useScoreHistory(isAllScores ? undefined : targetUserId, songId);
  const {
    historyGroups: allHistory,
    isLoading: allLoading,
    isError: allError,
    mutate: mutateAll,
  } = useAllScoreHistory(targetUserId, songId, isAllScores);

  const historyGroups = isAllScores ? allHistory : mainHistory;
  const isLoading = isAllScores ? allLoading : mainLoading;
  const isError = isAllScores ? allError : mainError;
  const mutate = isAllScores ? mutateAll : mutateMain;

  // 使用オプションは、自分の記録だけ選べる。選んだらすぐ保存する（#708）
  const editable = !!fbUser && targetUserId === fbUser.uid;
  const changeUseOption = async (logId: number, useOption: string | null) => {
    if (!fbUser || !targetUserId) return;
    const patch = (groups: SongHistoryResponse | undefined) =>
      groups &&
      (Object.fromEntries(
        Object.entries(groups).map(([v, rs]) => [v, rs.map((r) => (r.logId === logId ? { ...r, useOption } : r))]),
      ) as SongHistoryResponse);
    // 先に画面へ反映し、保存できなければ取り直す
    void mutate(patch, { revalidate: false });
    const res = await saveUseOption(targetUserId, { logId, songDomain: isAllScores ? "allSongs" : "bpi", useOption }, fbUser);
    if (!res.ok) {
      toast.error(res.message ?? "使用オプションを保存できませんでした");
      void mutate();
    }
  };

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
      onUseOptionChange={editable ? changeUseOption : undefined}
    />
  );
};

export default SongHistoryTab;
