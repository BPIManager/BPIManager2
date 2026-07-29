import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TowerRankingEntry } from "@/types/users/ranking";

interface TowerRankingRowProps {
  entry: TowerRankingEntry;
  onClick?: (userId: string) => void;
}

export const TowerRankingRow = ({ entry, onClick }: TowerRankingRowProps) => {
  const isPrivate = entry.isPublic === 0 && !entry.isSelf;
  const isClickable = !isPrivate && !!onClick;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick(entry.userId) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(entry.userId);
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
        entry.isSelf
          ? "border-bpim-primary/50 bg-bpim-primary/10"
          : "border-bpim-border bg-bpim-surface-2/40",
        isPrivate && "opacity-50",
        isClickable && "cursor-pointer hover:bg-bpim-overlay/60",
      )}
    >
      <span className="w-7 shrink-0 text-right font-mono text-xs font-bold text-bpim-muted">
        #{entry.rank}
      </span>

      {isPrivate ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-bpim-border bg-bpim-surface-2/60">
          <Lock className="h-3 w-3 text-bpim-muted" />
        </div>
      ) : (
        <Avatar className="h-7 w-7 shrink-0 border border-bpim-border">
          <AvatarImage src={entry.profileImage ?? ""} loading="lazy" />
          <AvatarFallback className="text-[10px]">
            {entry.userName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-xs font-bold",
            entry.isSelf ? "text-bpim-primary" : "text-bpim-text",
          )}
        >
          {isPrivate ? "非公開ユーザー" : entry.userName}
        </span>
        {!isPrivate && entry.iidxId && (
          <span className="text-[10px] text-bpim-muted">{entry.iidxId}</span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-bpim-muted leading-none mb-0.5">
            合計
          </span>
          <div className="inline-flex min-w-11 items-center justify-center rounded-sm border border-bpim-border bg-bpim-overlay/40 px-1.5 py-0.5 font-mono text-xs font-bold text-bpim-text">
            {entry.totalCount.toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-bpim-muted leading-none mb-0.5">
            鍵盤
          </span>
          <div className="inline-flex min-w-11 items-center justify-center rounded-sm border border-bpim-primary bg-bpim-overlay/40 px-1.5 py-0.5 font-mono text-xs font-bold text-bpim-primary">
            {entry.keyCount.toLocaleString()}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-bpim-muted leading-none mb-0.5">
            スクラッチ
          </span>
          <div className="inline-flex min-w-11 items-center justify-center rounded-sm border border-bpim-warning bg-bpim-overlay/40 px-1.5 py-0.5 font-mono text-xs font-bold text-bpim-warning">
            {entry.scratchCount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
