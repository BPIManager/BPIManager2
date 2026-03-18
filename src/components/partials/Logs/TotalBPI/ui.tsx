import { BpiCalculator } from "@/lib/bpi";
import { TrendingUp, TrendingDown, ChevronRight, Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";

export const BatchTotalBpiCard = ({ pagination }: { pagination: any }) => {
  const prevBpi = pagination.prev?.totalBpi ?? -15;
  const currentBpi = pagination.current?.totalBpi ?? -15;
  const bpiDiff = currentBpi - prevBpi;

  const prevRank = BpiCalculator.estimateRank(prevBpi);
  const currentRank = BpiCalculator.estimateRank(currentBpi);
  const rankDiff = prevRank - currentRank;

  const BpiIcon = bpiDiff > 0 ? TrendingUp : bpiDiff < 0 ? TrendingDown : Minus;
  const bpiColorClass =
    bpiDiff > 0
      ? "text-blue-400"
      : bpiDiff < 0
        ? "text-red-400"
        : "text-slate-500";
  const bpiBgClass =
    bpiDiff > 0
      ? "bg-blue-500/10"
      : bpiDiff < 0
        ? "bg-red-500/10"
        : "bg-slate-500/10";

  const RankIcon =
    rankDiff > 0 ? TrendingUp : rankDiff < 0 ? TrendingDown : Minus;
  const rankColorClass = rankDiff > 0 ? "text-orange-400" : "text-slate-500";

  return (
    <DashCard className="mb-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-10">
        <div className="flex w-full items-center gap-4 md:w-auto">
          <div
            className={cn("rounded-xl p-3 shrink-0", bpiBgClass, bpiColorClass)}
          >
            <BpiIcon className="h-6 w-6 md:h-8 md:w-8" />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-start gap-1 w-full">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            総合BPI (☆12)
          </span>
          <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
            <span className="font-mono text-lg font-bold text-slate-500 md:text-2xl">
              {prevBpi.toFixed(2)}
            </span>
            <ChevronRight className="h-3 w-3 text-slate-800" />
            <span className="font-mono text-3xl font-bold text-white leading-none md:text-4xl">
              {currentBpi.toFixed(2)}
            </span>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5",
                bpiBgClass,
                bpiColorClass,
              )}
            >
              <BpiIcon className="h-3 w-3" />
              <span className="font-mono text-xs font-bold">
                {bpiDiff >= 0 ? "+" : ""}
                {bpiDiff.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Separator className="h-px w-full opacity-10 md:h-10 md:w-px" />

        <div className="flex flex-1 flex-col items-start gap-1 w-full">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            推定順位
          </span>
          <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
            <div className="font-mono text-md font-bold text-slate-500 md:text-xl">
              {prevRank.toLocaleString()}
              <span className="ml-0.5 text-[10px]">位</span>
            </div>
            <ChevronRight className="h-3 w-3 text-slate-800" />
            <div className="font-mono text-2xl font-bold text-orange-200 leading-none md:text-3xl">
              {currentRank.toLocaleString()}
              <span className="ml-0.5 text-xs">位</span>
            </div>
            {rankDiff !== 0 && (
              <div className={cn("flex items-center gap-1", rankColorClass)}>
                <RankIcon className="h-3 w-3" />
                <span className="font-mono text-xs font-bold">
                  {Math.abs(rankDiff)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashCard>
  );
};
