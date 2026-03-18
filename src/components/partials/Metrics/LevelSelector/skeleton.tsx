import { Skeleton } from "@/components/ui/skeleton";

export const ArenaAverageFilterSkeleton = () => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4">
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
      <div className="flex flex-col gap-2 min-w-full md:min-w-[240px]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-12" />
        <div className="flex h-9 items-center gap-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
