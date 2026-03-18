import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const TotalBpiHistorySkeleton = () => {
  return (
    <DashCard className="h-[420px]">
      <Skeleton className="mb-8 h-4 w-[140px]" />

      <div className="relative mb-6 flex h-[240px] w-full items-end justify-between px-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <Skeleton
              className="w-1 rounded-t-sm opacity-30"
              style={{ height: `${Math.random() * 40 + 10}%` }}
            />
          </div>
        ))}

        <div className="absolute left-10 right-10 top-[120px]">
          <Skeleton className="h-[2px] w-full opacity-20" />
        </div>
      </div>

      <div className="mb-6 flex justify-between px-10">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
      </div>

      <div className="px-2">
        <Skeleton className="h-[30px] w-full rounded-md" />
      </div>
    </DashCard>
  );
};
