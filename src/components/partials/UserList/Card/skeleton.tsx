import { Skeleton } from "@/components/ui/skeleton";

export const UserRecommendationCardSkeleton = () => {
  return (
    <div className="flex min-h-[140px] w-full items-stretch justify-between gap-3 rounded-2xl border border-bpim-border bg-bpim-bg/40 p-3 md:min-h-[180px] md:gap-6 md:p-5">
      <div className="flex flex-1 flex-col justify-start gap-3 py-1 md:gap-4">
        <div className="flex w-full items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full md:h-12 md:w-12" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-[60%]" />
            <Skeleton className="h-2.5 w-[40%]" />
          </div>
        </div>
        <div className="w-full">
          <Skeleton className="mb-2 h-2 w-[30px]" />
          <div className="flex items-end gap-2">
            <Skeleton className="h-6 w-[60px]" />
            <Skeleton className="h-3 w-[30px]" />
          </div>
        </div>
        <div className="w-full">
          <Skeleton className="mb-2 h-2 w-[40px]" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
      <Skeleton className="h-[100px] w-[100px] self-center rounded-xl sm:h-[120px] sm:w-[120px] md:h-[140px] md:w-[140px]" />
    </div>
  );
};
