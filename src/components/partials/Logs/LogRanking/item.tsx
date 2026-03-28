import { ChevronRight } from "lucide-react";
import { BatchDetailItem } from "@/hooks/batches/useBatchDetail";
import { cn } from "@/lib/utils";

interface RankItemProps {
  item: BatchDetailItem;
  rank: number;
  type: "growth" | "top";
  onClick: () => void;
  isSharing?: boolean;
}

export const RankItem = ({
  item,
  rank,
  type,
  onClick,
  isSharing,
}: RankItemProps) => {
  const isGrowth = type === "growth";
  const isNew = !item.previous;

  const getBpiColor = (val: number) => {
    if (isGrowth) {
      if (val >= 10) return "text-bpim-danger";
      if (val >= 5) return "text-bpim-warning";
      if (val >= 3) return "text-yellow-300";
      if (val >= 1) return "text-bpim-success";
      return "text-cyan-400";
    }
    if (val >= 100) return "text-pink-400";
    if (val >= 70) return "text-yellow-300";
    if (val >= 40) return "text-bpim-success";
    if (val >= 0) return "text-bpim-primary";
    return "text-bpim-muted";
  };

  const rankColor =
    rank === 1
      ? "text-yellow-400"
      : rank === 2
        ? "text-bpim-muted"
        : rank === 3
          ? "text-bpim-warning"
          : "text-bpim-subtle";

  const diffBpiColor = getBpiColor(isGrowth ? item.diff.bpi : item.current.bpi);
  const prevEx = isNew ? 0 : item.current.exScore - item.diff.exScore;
  const prevBpi = isNew ? -15 : item.current.bpi - item.diff.bpi;

  if (isSharing) {
    const fullDiff = String(item.difficulty || "").toUpperCase();

    const ShareDataRow = ({
      label,
      prev,
      current,
      diff,
      diffColor,
      isBpi = false,
    }: {
      label: string;
      prev: number;
      current: number;
      diff: number;
      diffColor: string;
      isBpi?: boolean;
    }) => (
      <div className="flex w-full items-center justify-between font-mono text-sm leading-none">
        <span className="w-[30px] text-[10px] font-bold text-bpim-subtle">
          {label}
        </span>
        <span className="w-[55px] text-right text-bpim-muted">
          {isBpi ? prev.toFixed(2) : prev}
        </span>
        <ChevronRight className="mx-1 h-3 w-3 text-bpim-subtle" />
        <span className="w-[55px] text-right font-bold text-bpim-text">
          {isBpi ? current.toFixed(2) : current}
        </span>
        <span className={cn("w-[60px] text-right font-bold", diffColor)}>
          +{isBpi ? diff.toFixed(2) : diff}
        </span>
      </div>
    );

    return (
      <div className="w-full border-b border-bpim-border bg-bpim-bg p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <span
              className={cn(
                "font-mono text-xl font-bold leading-none",
                rankColor,
              )}
            >
              {rank}
            </span>
            <span className="line-clamp-2 text-md font-bold text-bpim-text">
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-bpim-muted">
              ☆{item.level}
            </span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-bpim-text uppercase",
                fullDiff === "LEGGENDARIA"
                  ? "bg-bpim-danger"
                  : fullDiff === "ANOTHER"
                    ? "bg-purple-600"
                    : "bg-bpim-primary",
              )}
            >
              {fullDiff}
            </span>
            {isNew && (
              <span className="rounded-sm bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-bpim-text">
                初プレイ
              </span>
            )}
          </div>

          <div className="mt-1 flex w-full flex-col gap-1.5">
            <ShareDataRow
              label="EX"
              prev={prevEx}
              current={item.current.exScore}
              diff={item.diff.exScore}
              diffColor="text-bpim-primary"
            />
            <ShareDataRow
              label="BPI"
              prev={prevBpi}
              current={item.current.bpi}
              diff={item.diff.bpi}
              diffColor={diffBpiColor}
              isBpi
            />
          </div>
        </div>
      </div>
    );
  }

  const ScoreRow = ({
    label,
    prev,
    current,
    diff,
    diffColor,
    isBpi = false,
  }: {
    label: string;
    prev: number;
    current: number;
    diff: number;
    diffColor: string;
    isBpi?: boolean;
  }) => {
    const isTopBpi = !isGrowth && isBpi;
    return (
      <div
        className={cn(
          "flex items-center justify-end gap-1 font-mono leading-none",
          isGrowth || isTopBpi ? "h-[26px]" : "h-[20px]",
        )}
      >
        <span className="w-[25px] text-left text-[9px] font-bold text-bpim-subtle">
          {label}
        </span>
        {isGrowth ? (
          <>
            <span className="w-[45px] text-right text-xs text-bpim-muted">
              {isBpi ? prev.toFixed(2) : prev}
            </span>
            <ChevronRight className="h-2 w-2 text-bpim-subtle" />
            <span className="w-[45px] text-right text-xs font-bold text-bpim-muted">
              {isBpi ? current.toFixed(2) : current}
            </span>
            <span
              className={cn(
                "w-[60px] text-right font-bold",
                isBpi ? "text-lg" : "text-sm",
                diffColor,
              )}
            >
              +{isBpi ? diff.toFixed(2) : diff}
            </span>
          </>
        ) : (
          <div className="flex w-[60px] justify-end items-baseline">
            <span
              className={cn(
                "text-right font-mono",
                isTopBpi
                  ? "text-lg font-black"
                  : "text-xs font-bold text-bpim-text",
                isTopBpi ? diffColor : "text-bpim-text",
              )}
            >
              {isBpi ? current.toFixed(2) : current}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-2 border-b border-bpim-border p-3 transition-colors cursor-pointer md:p-4",
        rank <= 3 ? "bg-bpim-card/50" : "bg-transparent",
        "hover:bg-bpim-overlay",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="w-5 shrink-0 text-center">
          <span
            className={cn(
              "font-mono text-lg font-bold leading-none",
              rankColor,
            )}
          >
            {rank}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-bpim-text leading-tight">
            {item.title}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-sm bg-bpim-surface-2 px-1 text-[9px] font-bold text-bpim-muted uppercase">
              {String(item.difficulty || "").slice(0, 1)}
            </span>
            <span className="text-[10px] font-bold text-bpim-subtle font-mono">
              ☆{item.level}
            </span>
            {isNew && (
              <span className="rounded-sm bg-purple-600 px-1 text-[8px] font-bold text-white leading-none py-0.5">
                NEW
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <ScoreRow
          label="EX"
          prev={prevEx}
          current={item.current.exScore}
          diff={item.diff.exScore}
          diffColor="text-bpim-primary"
        />
        <ScoreRow
          label="BPI"
          prev={prevBpi}
          current={item.current.bpi}
          diff={item.diff.bpi}
          diffColor={diffBpiColor}
          isBpi
        />
      </div>
    </div>
  );
};
