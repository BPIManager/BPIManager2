"use client";

import { useMemo } from "react";
import {
  LuTrendingUp,
  LuCalendar,
  LuHistory,
  LuCrown,
  LuLoader,
} from "react-icons/lu";
import dayjs from "@/lib/dayjs";
import { useUser } from "@/contexts/users/UserContext";
import { useScoreHistory } from "@/hooks/score/useScoreLogs";
import { Score } from "@/types/sql";
import { versionTitles } from "@/constants/versions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SongHistoryTabProps {
  songId: number;
}

export const SongHistoryTab = ({ songId }: SongHistoryTabProps) => {
  const { fbUser } = useUser();
  const { historyGroups, isLoading, isError } = useScoreHistory(
    fbUser?.uid,
    songId,
  );

  const globalMaxScore = useMemo(() => {
    if (!historyGroups) return 0;
    return Math.max(
      ...Object.values(historyGroups)
        .flat()
        .map((s) => s.exScore),
    );
  }, [historyGroups]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LuLoader className="h-8 w-8 animate-spin text-bpim-text" />
      </div>
    );
  }

  if (isError || !historyGroups || Object.keys(historyGroups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <LuHistory className="h-10 w-10 text-bpim-subtle" />
        <p className="text-sm font-medium text-bpim-muted">
          履歴データが見つかりません
        </p>
      </div>
    );
  }

  const sortedVersions = Object.keys(historyGroups).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <div className="flex flex-col gap-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
      {sortedVersions.map((version) => {
        const vInfo = versionTitles.find((v) => v.num === version);
        const displayTitle = vInfo ? vInfo.title : `Ver.${version}`;

        return (
          <div key={version} className="flex flex-col">
            <div className="mb-3 flex items-center gap-4 px-1">
              <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase">
                {displayTitle}
              </span>
              <Separator className="flex-1 bg-white/10" />
            </div>

            <div className="flex flex-col gap-2.5">
              {historyGroups[version].map((record: Score, idx: number) => {
                const prevInVersion = historyGroups[version][idx + 1];
                const scoreDiff = prevInVersion
                  ? record.exScore - prevInVersion.exScore
                  : null;

                const isGlobalBest =
                  record.exScore === globalMaxScore && globalMaxScore > 0;

                return (
                  <div
                    key={record.logId}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-lg border-l-3 bg-white/5 p-3 transition-colors hover:bg-bpim-overlay",
                      isGlobalBest
                        ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                        : "border-white/20",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-bpim-muted">
                        <LuCalendar className="h-3 w-3" />
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
                            <LuTrendingUp className="mr-0.5 h-2.5 w-2.5" />+
                            {scoreDiff}
                          </Badge>
                        )}

                        {isGlobalBest && (
                          <Badge className="h-4 bg-yellow-500 text-black px-1.5 text-[9px] font-black border-none">
                            <LuCrown className="mr-0.5 h-2.5 w-2.5" />
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
                            isGlobalBest ? "text-yellow-200" : "text-bpim-text",
                          )}
                        >
                          {record.exScore.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-bpim-muted">
                          BPI: {(record.bpi || -15).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-black uppercase text-bpim-text">
                          {record.clearState || "NO PLAY"}
                        </span>
                        {record.missCount !== null && (
                          <span className="font-mono text-[9px] font-bold text-bpim-danger/80">
                            MISS: {record.missCount}
                          </span>
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
