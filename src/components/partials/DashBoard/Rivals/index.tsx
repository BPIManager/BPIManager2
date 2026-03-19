import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RivalComparisonRow } from "./ui";
import { RivalWinLossSummarySkeleton } from "./skeleton";
import { RivalWinLossSummaryNotFound } from "./nodata";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";

export const RivalWinLossSummary = ({
  userId,
}: {
  userId?: string | undefined;
}) => {
  const { levels, diffs, version } = useStatsFilter();
  const { results, isLoading } = useRivalSummary({
    userId,
    version,
    levels,
    difficulties: diffs,
  });
  const [showAll, setShowAll] = useState(false);

  const displayCount = 5;
  const hasMore = results.length > displayCount;
  const visibleItems = showAll ? results : results.slice(0, displayCount);

  return (
    <DashCard>
      <h3 className="mb-4 text-sm font-bold uppercase text-bpim-muted">
        ライバル勝敗
      </h3>

      {isLoading ? (
        <RivalWinLossSummarySkeleton />
      ) : results.length === 0 ? (
        <RivalWinLossSummaryNotFound />
      ) : (
        <div className="flex flex-col gap-4">
          {visibleItems.map((rival) => (
            <RivalComparisonRow key={rival.userId} rival={rival} />
          ))}
        </div>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          className="mt-4 flex w-full items-center justify-center gap-2 text-xs text-bpim-muted transition-colors hover:bg-bpim-overlay/50 hover:text-bpim-text"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4" /> 閉じる
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" /> 残り{" "}
              {results.length - displayCount} 人を表示
            </>
          )}
        </Button>
      )}
    </DashCard>
  );
};
