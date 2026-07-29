import { Skeleton } from "@/components/ui/skeleton";

export const BpiOptimizerSkeleton = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-3"
      >
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);
