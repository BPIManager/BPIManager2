"use client";

import { useMemo } from "react";
import { useUser } from "@/contexts/users/UserContext";
import { useScoreHistory } from "@/hooks/score/useScoreLogs";
import { useAllScoreHistory } from "@/hooks/allScores/useAllScoresHistory";
import { versionTitles } from "@/constants/iidx/versionTitles";
import { Separator } from "@/components/ui/separator";
import { History } from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { HistoryRecordCard } from "@/components/partials/common/Songs/HistoryRecordCard";
import { FetchErrorState } from "@/components/partials/common/FetchErrorState";

interface SongHistoryTabProps {
  songId: number;
  /** 全難易度スコア(BPI未計算)の場合に notes を渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
}

export const SongHistoryTab = ({ songId, notes }: SongHistoryTabProps) => {
  const { fbUser } = useUser();
  const isAllScores = notes != null;

  const {
    historyGroups: mainHistory,
    isLoading: mainLoading,
    isError: mainError,
  } = useScoreHistory(isAllScores ? undefined : fbUser?.uid, songId);
  const {
    historyGroups: allHistory,
    isLoading: allLoading,
    isError: allError,
  } = useAllScoreHistory(fbUser?.uid, songId, isAllScores);

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

  if (!historyGroups || Object.keys(historyGroups).length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <History className="h-10 w-10 text-bpim-subtle" />
        <p className="text-sm font-medium text-bpim-muted">
          履歴データが見つかりません
        </p>
      </div>
    );

  const sortedVersions = Object.keys(historyGroups).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <div className="flex flex-col gap-6 max-h-[45svh] overflow-y-auto pr-2 custom-scrollbar">
      {sortedVersions.map((version) => {
        const records = historyGroups[version];
        const displayTitle =
          versionTitles.find((v) => v.num === version)?.title ??
          `Ver.${version}`;

        return (
          <div key={version} className="flex flex-col">
            <div className="mb-3 flex items-center gap-4 px-1">
              <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase">
                {displayTitle}
              </span>
              <Separator className="flex-1 bg-bpim-overlay/60" />
            </div>

            <div className="flex flex-col gap-2.5">
              {records.map((record, idx) => {
                const prev = records[idx + 1];
                return (
                  <HistoryRecordCard
                    key={record.logId}
                    record={record}
                    scoreDiff={prev ? record.exScore - prev.exScore : null}
                    isGlobalBest={
                      globalMaxScore > 0 && record.exScore === globalMaxScore
                    }
                    notes={notes}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
