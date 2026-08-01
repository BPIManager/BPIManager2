import { Lock } from "lucide-react";
import type { RowComponentProps } from "react-window";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRankingRate } from "@/utils/songs/rankingRate";
import type { SongRankingEntry } from "@/types/users/ranking";

export const RANKING_ROW_HEIGHT = 48;

export interface SongRankingRowProps {
  rankings: SongRankingEntry[];
  selfExScore?: number | null;
  onNavigate: (userId: string) => void;
  /** 全難易度スコア(BPI未計算)の場合に渡す。渡された場合はBPIの代わりにnotes基準の%を表示する */
  notes?: number;
}

export function SongRankingTableHeader({
  showDiff = false,
  rateLabel = "EX / BPI",
}: {
  showDiff?: boolean;
  rateLabel?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-center border-b border-bpim-border bg-bpim-surface-2 px-3 py-2",
        showDiff
          ? "grid-cols-[40px_1fr_auto_52px]"
          : "grid-cols-[40px_1fr_auto]",
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
        #
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
        Player
      </span>
      <span className="mr-2 text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
        {rateLabel}
      </span>
      {showDiff && (
        <span className="text-right text-[10px] font-bold uppercase tracking-wider text-bpim-muted">
          Diff
        </span>
      )}
    </div>
  );
}

export function SongRankingListRow({
  index,
  style,
  rankings,
  selfExScore,
  onNavigate,
  notes,
}: RowComponentProps<SongRankingRowProps>) {
  const row = rankings[index];
  if (!row) return null;

  const isPrivate = !row.userName || row.userName === "-";
  const isSelf = row.isSelf;
  const showDiff = selfExScore !== undefined;
  const diff = showDiff ? (row.exScore ?? 0) - (selfExScore ?? 0) : 0;
  const isClickable = !isSelf && !isPrivate;

  return (
    <div
      style={style}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onNavigate(row.userId) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigate(row.userId);
              }
            }
          : undefined
      }
      className={cn(
        "grid items-center border-b border-bpim-border px-3 transition-colors last:border-b-0",
        showDiff
          ? "grid-cols-[40px_1fr_auto_52px]"
          : "grid-cols-[40px_1fr_auto]",
        isSelf
          ? "bg-bpim-primary-dim/30 hover:bg-bpim-primary-dim/40"
          : isPrivate
            ? "opacity-50"
            : "cursor-pointer hover:bg-bpim-overlay/50",
      )}
    >
      <span
        className={cn(
          "font-mono text-xs font-bold",
          row.rank <= 3 ? "text-yellow-500" : "text-bpim-muted",
        )}
      >
        #{row.rank}
      </span>

      <div className="flex min-w-0 items-center gap-2">
        {isPrivate ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bpim-border bg-bpim-surface-2/60">
            <Lock className="h-3 w-3 text-bpim-muted" />
          </div>
        ) : (
          <Avatar className="h-6 w-6 shrink-0 border border-bpim-border">
            <AvatarImage src={row.profileImage ?? ""} />
            <AvatarFallback className="text-[9px]">
              {row.userName?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-xs tracking-tight text-bpim-text",
              isSelf ? "font-bold" : "font-medium",
            )}
          >
            {isPrivate ? "非公開ユーザー" : row.userName}
          </p>
          {isSelf && (
            <p className="text-[9px] font-bold leading-none text-bpim-primary">
              あなた
            </p>
          )}
        </div>
      </div>

      <div className="mr-2 flex flex-col items-end gap-0.5">
        <span className="font-mono text-xs font-bold text-bpim-text">
          {row.exScore ?? 0}
        </span>
        <span className="font-mono text-[10px] text-bpim-muted">
          {formatRankingRate(row, notes)}
        </span>
      </div>

      {showDiff && (
        <span
          className={cn(
            "text-right font-mono text-xs font-bold",
            diff > 0
              ? "text-bpim-danger"
              : diff < 0
                ? "text-bpim-success"
                : "text-bpim-subtle",
          )}
        >
          {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
        </span>
      )}
    </div>
  );
}
