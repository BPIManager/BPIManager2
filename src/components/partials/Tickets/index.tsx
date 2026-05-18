"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookmarkletAccordion } from "@/components/partials/Import/View/bookmarklet";
import { TicketCard } from "@/components/partials/Tickets/TicketCard";
import { TicketCardSkeleton } from "@/components/partials/Tickets/TicketSkeleton";
import { TicketFeatureDescription } from "@/components/partials/Tickets/FeatureDescription";
import { useTicketSearch } from "@/hooks/tickets/useTicketSearch";
import type { ScoreMode } from "@/types/tickets";

const SCORE_MODE_OPTIONS: { value: ScoreMode; label: string }[] = [
  { value: "relative", label: "当たり譜面度（%）" },
  { value: "raw", label: "配置スコア（絶対値）" },
];

export function TicketsSection() {
  const {
    csvInput,
    setCsvInput,
    scoreMode,
    handleScoreModeChange,
    isLoading,
    error,
    cardStates,
    orderedTicketIds,
    handleSearch,
    handleLoadMore,
    handleSortChange,
  } = useTicketSearch();

  const skeletonCount = Math.max(orderedTicketIds.length, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-bpim-text">チケット情報を貼り付け</p>
          <p className="text-xs text-bpim-muted">
            ブックマークレットから出力されたCSVを貼り付けてください
          </p>
        </div>
        <Textarea
          placeholder={"チケット番号,有効期限\n2641753,2026/10/09\n3147625,2026/10/09"}
          className="font-mono text-xs resize-y min-h-28"
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
        />
        <BookmarkletAccordion
          lastStep={
            <>
              このページに戻り、チケット番号の一覧をテキストエリアに貼り付けて「当たり譜面を探す」をクリックします。
            </>
          }
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-bpim-muted shrink-0">スコア表示:</span>
            <Select
              value={scoreMode}
              onValueChange={(v) => handleScoreModeChange(v as ScoreMode)}
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORE_MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={isLoading || !csvInput.trim()}>
            {isLoading ? "検索中..." : "当たり譜面を探す"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      ) : orderedTicketIds.length > 0 ? (
        <div className="flex flex-col gap-5">
          {orderedTicketIds.map((ticketId) => {
            const state = cardStates.get(ticketId);
            if (!state) return null;
            return (
              <TicketCard
                key={ticketId}
                state={state}
                scoreMode={scoreMode}
                onLoadMore={handleLoadMore}
                onSortChange={handleSortChange}
              />
            );
          })}
        </div>
      ) : null}

      <TicketFeatureDescription />
    </div>
  );
}
