import { Skeleton } from "@/components/ui/skeleton";

const WinLossHistoryChartSkeleton = () => (
  <div className="mt-3 flex flex-col gap-2">
    <div className="flex items-center gap-3">
      <Skeleton className="h-2 w-2 rounded-sm" />
      <Skeleton className="h-2 w-12" />
      <Skeleton className="h-2 w-2 rounded-sm" />
      <Skeleton className="h-2 w-12" />
    </div>
    <Skeleton className="h-36 w-full rounded-md" />
  </div>
);

/** WIN / LOSS STATS 全体（見出し + LEVEL 11/12 のカード）の読み込み中表示 */
export const WinLossStatsSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Skeleton className="h-3 w-3 rounded-sm" />
      <Skeleton className="h-2.5 w-28" />
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[11, 12].map((lv) => (
        <div
          key={lv}
          className="rounded-xl border border-bpim-border bg-bpim-surface-2/40 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2.5 w-10" />
          </div>
          <div className="flex items-center justify-around">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-2 w-6" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3 h-0.5 w-full rounded-full" />
          <WinLossHistoryChartSkeleton />
        </div>
      ))}
    </div>
  </div>
);

export default WinLossHistoryChartSkeleton;
