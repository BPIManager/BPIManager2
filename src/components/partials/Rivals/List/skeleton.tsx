import { Skeleton } from "@/components/ui/skeleton";

export const RivalSummarySkeleton = () => (
  <div className="flex min-h-[140px] w-full items-stretch justify-between gap-3 rounded-2xl border border-bpim-border bg-bpim-bg/40 p-3 md:gap-6 md:p-5">
    <div className="flex flex-1 flex-col gap-4 py-1">
      <div className="flex w-full items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full md:h-12 md:w-12" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-[100px]" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    </div>
    <Skeleton className="h-[90px] w-[90px] self-center rounded-xl sm:h-[110px] sm:w-[110px] md:h-[130px] md:w-[130px]" />
  </div>
);
