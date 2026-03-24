"use client";

import { useMemo } from "react";
import dayjs from "@/lib/dayjs";
import { useUser } from "@/contexts/users/UserContext";
import { versionTitles } from "@/constants/versions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Crown,
  TrendingUp,
  History,
  Loader,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useAllScoreHistory } from "@/hooks/allScores/useAllScoresHistory";

export const AllSongHistoryTab = ({ songId }: { songId: number }) => {
  const { fbUser } = useUser();
  const { historyGroups, isLoading, isError } = useAllScoreHistory(
    fbUser?.uid,
    songId,
  );

  const globalMaxScore = useMemo(() => {
    if (!historyGroups) return 0;
    return Math.max(
      ...Object.values(historyGroups as Record<string, any[]>)
        .flat()
        .map((s) => s.exScore ?? 0),
    );
  }, [historyGroups]);

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-bpim-text" />
      </div>
    );

  if (isError || !historyGroups || Object.keys(historyGroups).length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <History className="h-10 w-10 text-bpim-subtle" />
        <p className="text-sm font-medium text-bpim-muted">
          履歴データが見つかりません
        </p>
      </div>
    );

  const sortedVersions = Object.keys(
    historyGroups as Record<string, any[]>,
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-6 max-h-[45svh] overflow-y-auto pr-2 custom-scrollbar">
      {sortedVersions.map((version) => {
        const vInfo = versionTitles.find((v) => v.num === version);
        const displayTitle = vInfo ? vInfo.title : `Ver.${version}`;
        const records = (historyGroups as Record<string, any[]>)[version];

        return (
          <div key={version} className="flex flex-col">
            <div className="mb-3 flex items-center gap-4 px-1">
              <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase">
                {displayTitle}
              </span>
              <Separator className="flex-1 bg-bpim-overlay/60" />
            </div>

            <div className="flex flex-col gap-2.5">
              {records.map((record: any, idx: number) => {
                const prev = records[idx + 1];
                const scoreDiff = prev ? record.exScore - prev.exScore : null;
                const isGlobalBest =
                  record.exScore === globalMaxScore && globalMaxScore > 0;

                return (
                  <div
                    key={record.logId}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-lg border-l-3 bg-bpim-surface-2/60 p-3 transition-colors hover:bg-bpim-overlay",
                      isGlobalBest
                        ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                        : "border-bpim-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-bpim-muted">
                        <Calendar className="h-3 w-3" />
                        <span className="font-mono text-[10px] font-medium">
                          {dayjs(record.lastPlayed)
                            .tz()
                            .format("YYYY/MM/DD HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {scoreDiff !== null && scoreDiff > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 bg-green-500/10 text-bpim-success border-green-500/20 px-1.5 text-[9px] font-bold"
                          >
                            <TrendingUp className="mr-0.5 h-2.5 w-2.5" />+
                            {scoreDiff}
                          </Badge>
                        )}
                        {isGlobalBest && (
                          <Badge className="h-4 bg-bpim-warning px-1.5 text-[9px] font-black border-none">
                            <Crown className="mr-0.5 h-2.5 w-2.5" />
                            BEST
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex flex-col gap-0">
                        <span
                          className={cn(
                            "font-mono text-lg font-black leading-none tracking-tighter",
                            isGlobalBest
                              ? "text-bpim-warning"
                              : "text-bpim-text",
                          )}
                        >
                          {record.exScore}
                        </span>
                        <span className="font-mono text-[10px] font-medium text-bpim-muted mt-0.5">
                          {record.clearState || "NO PLAY"}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        {record.missCount !== null && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5 text-bpim-danger" />
                            <span
                              className={cn(
                                "font-mono text-xs font-bold",
                                record.missCount === 0
                                  ? "text-bpim-success"
                                  : "text-bpim-danger",
                              )}
                            >
                              MISS: {record.missCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
