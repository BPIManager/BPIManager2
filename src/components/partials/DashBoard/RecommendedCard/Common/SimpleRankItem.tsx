"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { diffColors, getLampClass } from "../../../Table/ui";
import { RecommendedItem } from "@/hooks/stats/useRecommended";

interface SimpleRankItemProps {
  item: RecommendedItem;
  rank: number;
  onClick: () => void;
}

export const SimpleRankItem = ({
  item,
  rank,
  onClick,
}: SimpleRankItemProps) => {
  const lampClass = getLampClass(item.clearState);
  const isFullCombo = item.clearState === "FULLCOMBO CLEAR";

  const difficultyBg = diffColors[item.difficulty] || "bg-bpim-surface-2";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between gap-3 p-3 pl-4 transition-colors duration-200",
        "border-b border-bpim-border cursor-pointer hover:bg-bpim-overlay/50",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 z-10",
          isFullCombo
            ? "bg-gradient-to-b from-yellow-300 to-yellow-500"
            : lampClass,
        )}
      />

      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="w-4 shrink-0">
          <span className="font-mono text-[10px] font-bold text-bpim-subtle block text-center">
            {rank}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-bold text-bpim-text tracking-tight">
            {item.title}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              className={cn(
                "h-3.5 px-1 text-[9px] border-none rounded-sm text-white flex items-center",
                difficultyBg,
              )}
            >
              {String(item.difficulty || "")
                .charAt(0)
                .toUpperCase()}
            </Badge>
            <span className="text-[10px] font-bold text-bpim-muted">
              ☆{item.difficultyLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 font-mono">
        <div className="flex flex-col items-end gap-0">
          <span className="text-[9px] font-bold text-bpim-subtle leading-none">
            EX
          </span>
          <span className="text-sm font-bold text-bpim-text leading-tight">
            {item.current.exScore}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0">
          <span className="text-[9px] font-bold text-bpim-subtle leading-none">
            BPI
          </span>
          <span className="text-sm font-bold text-bpim-primary leading-tight">
            {(item.current.bpi ?? -15).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
