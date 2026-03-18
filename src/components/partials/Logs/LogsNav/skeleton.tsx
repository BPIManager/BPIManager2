import { Skeleton } from "@/components/ui/skeleton";

export const LogNavigatorSkeleton = () => (
  <div className="mb-6 flex w-full items-center justify-between rounded-xl border border-bpim-border bg-bpim-bg p-2">
    <div className="flex-1">
      <Skeleton className="h-10 w-[60px] rounded-md md:w-[120px]" />
    </div>

    <div className="flex flex-col items-center gap-1 px-2">
      <Skeleton className="h-2.5 w-10" />
      <Skeleton className="h-3.5 w-20 md:w-[120px]" />
    </div>

    <div className="flex flex-1 justify-end">
      <Skeleton className="h-10 w-[60px] rounded-md md:w-[120px]" />
    </div>
  </div>
);
