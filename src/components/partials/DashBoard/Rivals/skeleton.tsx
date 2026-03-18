import { Skeleton } from "@/components/ui/skeleton";

export const RivalWinLossSummarySkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            <Skeleton className="h-2.5 w-[40px]" />
          </div>
          <Skeleton className="h-[18px] w-full rounded-sm" />
        </div>
      ))}
    </div>
  );
};
