import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const LogsCardSkeleton = () => {
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-2.5 w-20 mb-1" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export const LogsGroupSkeleton = () => {
  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <Skeleton className="hidden h-3 w-3 rounded-full md:block shrink-0" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div
        className={cn(
          "rounded-lg border border-white/5 bg-white/[0.02] p-4 mb-4",
          "md:ml-8",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-8">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <Skeleton className="hidden h-9 w-32 rounded-md sm:block" />
        </div>
      </div>

      {/* カードリスト */}
      <div className="flex flex-col gap-3 md:ml-8">
        <LogsCardSkeleton />
        <LogsCardSkeleton />
      </div>
    </div>
  );
};
