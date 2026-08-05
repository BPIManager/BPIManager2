import dayjs from "@/lib/dayjs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import type { Score } from "@/types/db";

const HistoryRecordCard = ({
  record,
  scoreDiff,
  isGlobalBest,
  notes,
}: {
  record: Score;
  scoreDiff: number | null;
  isGlobalBest: boolean;
  /** 全難易度スコア(BPI未計算)の場合に渡す。渡された場合はBPIの代わりにnotes基準の%を表示する */
  notes?: number;
}) => {
  const scoreColor = isGlobalBest ? "text-bpim-warning" : "text-bpim-text";

  return (
    <div
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
            {dayjs(record.lastPlayed).tz().format("YYYY/MM/DD HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {scoreDiff !== null && scoreDiff > 0 && (
            <Badge
              variant="secondary"
              className="h-4 bg-green-500/10 text-bpim-success border-green-500/20 px-1.5 text-[9px] font-bold"
            >
              <TrendingUp className="mr-0.5 h-2.5 w-2.5" />+{scoreDiff}
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
              scoreColor,
            )}
          >
            {record.exScore}
          </span>
          {notes != null ? (
            <span className="font-mono text-[10px] font-medium text-bpim-muted mt-0.5">
              {((record.exScore / (notes * 2)) * 100).toFixed(1)}%{"  "}
              {record.clearState || "NO PLAY"}
            </span>
          ) : (
            <span className="font-mono text-[10px] font-bold text-bpim-muted">
              BPI: {(record.bpi || -15).toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-0.5">
          {notes != null ? (
            record.missCount !== null && (
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
            )
          ) : (
            <>
              <span className="text-[10px] font-black uppercase text-bpim-text">
                {record.clearState || "NO PLAY"}
              </span>
              {record.missCount !== null && (
                <span className="font-mono text-[9px] font-bold text-bpim-danger/80">
                  MISS: {record.missCount}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryRecordCard;
