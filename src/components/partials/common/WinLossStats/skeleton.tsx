import { Skeleton } from "@/components/ui/skeleton";

export const WinLossHistoryChartSkeleton = () => (
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
