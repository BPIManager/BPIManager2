import { memo } from "react";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ArenaClassBadge from "@/components/partials/common/Badge/ArenaClassBadge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TopRankersRankingEntry } from "@/types/users/ranking";

interface TopRankersRankingRowProps {
  entry: TopRankersRankingEntry;
  onClick?: (userId: string) => void;
}

const TopRankersRankingRowComponent = ({
  entry,
  onClick,
}: TopRankersRankingRowProps) => {
  const { t } = useTranslation();
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
        {!isPrivate && entry.arenaClass && (
          <ArenaClassBadge arenaClass={entry.arenaClass} size="sm" />
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center">
        <span className="mb-0.5 text-[9px] leading-none text-bpim-muted">
          {t("ranking.topRankers.holdCount")}
        </span>
        <div className="inline-flex min-w-11 items-center justify-center rounded-sm border border-bpim-border bg-bpim-overlay/40 px-1.5 py-0.5 font-mono text-xs font-bold text-bpim-text">
          {entry.holdCount.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const TopRankersRankingRow = memo(TopRankersRankingRowComponent);

export default TopRankersRankingRow;
