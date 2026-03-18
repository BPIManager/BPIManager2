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
      if (val >= 10) return "text-red-400";
      if (val >= 5) return "text-orange-400";
      if (val >= 3) return "text-yellow-300";
      if (val >= 1) return "text-green-400";
      return "text-cyan-400";
    }
    if (val >= 100) return "text-pink-400";
    if (val >= 70) return "text-yellow-300";
    if (val >= 40) return "text-green-400";
    if (val >= 0) return "text-blue-400";
    return "text-gray-500";
  };

  const rankColor =
    rank === 1
      ? "text-yellow-400"
      : rank === 2
        ? "text-slate-400"
        : rank === 3
          ? "text-orange-400"
          : "text-slate-700";

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
    }: any) => (
      <div className="flex w-full items-center justify-between font-mono text-sm leading-none">
        <span className="w-[30px] text-[10px] font-bold text-gray-600">
          {label}
        </span>
        <span className="w-[55px] text-right text-gray-400">
          {isBpi ? prev.toFixed(2) : prev}
        </span>
        <ChevronRight className="mx-1 h-3 w-3 text-gray-700" />
        <span className="w-[55px] text-right font-bold text-white">
          {isBpi ? current.toFixed(2) : current}
        </span>
        <span className={cn("w-[60px] text-right font-bold", diffColor)}>
          +{isBpi ? diff.toFixed(2) : diff}
        </span>
      </div>
    );

    return (
      <div className="w-full border-b border-white/5 bg-slate-950 p-4">
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
            <span className="line-clamp-2 text-md font-bold text-white">
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500">
              ☆{item.level}
            </span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-white uppercase",
                fullDiff === "LEGGENDARIA"
                  ? "bg-red-600"
                  : fullDiff === "ANOTHER"
                    ? "bg-purple-600"
                    : "bg-blue-600",
              )}
            >
              {fullDiff}
            </span>
            {isNew && (
              <span className="rounded-sm bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
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
              diffColor="text-blue-400"
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
  }: any) => {
    const isTopBpi = !isGrowth && isBpi;
    return (
      <div
        className={cn(
          "flex items-center justify-end gap-1 font-mono leading-none",
          isGrowth || isTopBpi ? "h-[26px]" : "h-[20px]",
        )}
      >
        <span className="w-[25px] text-left text-[9px] font-bold text-gray-600">
          {label}
        </span>
        {isGrowth ? (
          <>
            <span className="w-[45px] text-right text-xs text-gray-400">
              {isBpi ? prev.toFixed(2) : prev}
            </span>
            <ChevronRight className="h-2 w-2 text-gray-800" />
            <span className="w-[45px] text-right text-xs font-bold text-gray-500">
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
                  : "text-xs font-bold text-white",
                isTopBpi ? diffColor : "text-white",
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
        "flex items-center justify-between gap-2 border-b border-white/5 p-3 transition-colors cursor-pointer md:p-4",
        rank <= 3 ? "bg-white/[0.03]" : "bg-transparent",
        "hover:bg-white/10",
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
          <span className="truncate text-sm font-bold text-white leading-tight">
            {item.title}
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-sm bg-gray-800 px-1 text-[9px] font-bold text-gray-400 uppercase">
              {String(item.difficulty || "").slice(0, 1)}
            </span>
            <span className="text-[10px] font-bold text-gray-600 font-mono">
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
          diffColor="text-blue-400"
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
