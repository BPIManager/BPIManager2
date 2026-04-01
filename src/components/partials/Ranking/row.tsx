import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBpiColorStyle } from "@/constants/bpiColor";
import type { RankingEntry } from "@/types/users/ranking";

interface RankingRowProps {
  entry: RankingEntry;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const RankingRow = ({ entry, onClick, style }: RankingRowProps) => {
  const isPrivate = entry.isPublic === 0 && !entry.isSelf;
  const bpiStyle = getBpiColorStyle(entry.totalBpi);

  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        entry.isSelf
          ? "border-bpim-primary/50 bg-bpim-primary/10"
          : "border-bpim-border bg-bpim-surface-2/40",
        !isPrivate && !entry.isSelf && "hover:bg-bpim-overlay/50",
        isPrivate && "opacity-50",
      )}
    >
      <span className="w-8 shrink-0 text-right font-mono text-xs font-bold text-bpim-muted">
        #{entry.rank}
      </span>

      {isPrivate ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bpim-border bg-bpim-surface-2/60">
          <Lock className="h-3.5 w-3.5 text-bpim-muted" />
        </div>
      ) : (
        <Avatar className="h-8 w-8 shrink-0 border border-bpim-border">
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
        {!isPrivate && entry.arenaRank && (
          <Badge className="mt-0.5 h-3.5 bg-orange-600 px-1 text-[9px] font-bold text-white">
            {entry.arenaRank}
          </Badge>
        )}
      </div>

      <div
        className="inline-flex min-w-[72px] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-xs font-bold"
        style={{
          borderColor: bpiStyle.bg,
          backgroundColor: `${bpiStyle.bg}22`,
        }}
      >
        {entry.totalBpi.toFixed(2)}
      </div>
    </div>
  );

  if (isPrivate) {
    return (
      <div style={style} className="w-full">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left"
      style={style}
      onClick={onClick}
    >
      {inner}
    </button>
  );
};
