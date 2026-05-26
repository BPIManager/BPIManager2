import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SongCard } from "@/components/partials/Tickets/SongCard";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TicketCardState } from "@/hooks/tickets/useTicketSearch";
import type { TicketSongResult, TicketSortKey, ScoreMode } from "@/types/tickets";

function sortItems(
  items: TicketSongResult[],
  sortKey: TicketSortKey,
  scoreMode: ScoreMode,
): TicketSongResult[] {
  return [...items].sort((a, b) => {
    if (sortKey === "patternScore")
      return scoreMode === "raw"
        ? b.patternScore - a.patternScore
        : b.relativeScore - a.relativeScore;
    if (sortKey === "bpiGap") {
      const ag = a.bpiGap ?? -Infinity;
      const bg = b.bpiGap ?? -Infinity;
      return bg - ag;
    }
    if (sortKey === "bpi") {
      const ab = a.bpi ?? -Infinity;
      const bb = b.bpi ?? -Infinity;
      return bb - ab;
    }
    return 0;
  });
}

interface TicketCardProps {
  state: TicketCardState;
  scoreMode: ScoreMode;
  onLoadMore: (ticketId: string) => void;
  onSortChange: (ticketId: string, sortKey: TicketSortKey) => void;
}

export function TicketCard({ state, scoreMode, onLoadMore, onSortChange }: TicketCardProps) {
  const { t } = useTranslation();
  const { result, sortKey, isLoadingMore, allItems, hasMore } = state;
  const sorted = sortItems(allItems, sortKey, scoreMode);

  const SORT_OPTIONS: { value: TicketSortKey; label: string }[] = [
    { value: "patternScore", label: t("tickets.sortPatternScore") },
    { value: "bpiGap", label: t("tickets.sortBpiGap") },
    { value: "bpi", label: t("tickets.sortBpi") },
  ];

  const today = new Date();
  const expiry = new Date(result.expiresAt.replace(/\//g, "-"));
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-bpim-text">
              #{result.ticketId}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${daysLeft <= 7 ? "border-red-500/50 text-red-400" : "border-bpim-border text-bpim-muted"}`}
            >
              {result.expiresAt} {t("tickets.expiresUntil")}
              {daysLeft > 0 && daysLeft <= 30 && ` (${t("tickets.daysLeftPre")}${daysLeft}${t("tickets.daysLeftSuf")})`}
            </Badge>
          </div>
          {result.totalBpi != null && (
            <span className="text-xs text-bpim-muted">
              {t("tickets.currentTotalBpi")}{" "}
              <span className="font-mono font-semibold text-bpim-text">
                {result.totalBpi.toFixed(2)}
              </span>
            </span>
          )}
        </div>

        <Select
          value={sortKey}
          onValueChange={(v) => onSortChange(result.ticketId, v as TicketSortKey)}
        >
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-bpim-muted text-center py-6">
          {t("tickets.noSongData")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((song) => (
            <SongCard
              key={song.songId}
              song={song}
              totalBpi={result.totalBpi}
              ticketId={result.ticketId}
              scoreMode={scoreMode}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          disabled={isLoadingMore}
          onClick={() => onLoadMore(result.ticketId)}
        >
          {isLoadingMore ? t("tickets.loadingMore") : t("tickets.loadMore")}
        </Button>
      )}
    </div>
  );
}
