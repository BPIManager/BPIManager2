import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const TotalBpiHistorySkeleton = () => {
  return (
    <DashCard className="h-105">
      <Skeleton className="mb-8 h-4 w-35" />

      <div className="relative mb-6 flex h-60 w-full items-end justify-between px-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <Skeleton
              className="w-1 rounded-t-sm opacity-30"
              style={{ height: `${Math.random() * 40 + 10}%` }}
            />
          </div>
        ))}

        <div className="absolute left-10 right-10 top-30">
          <Skeleton className="h-0.5 w-full opacity-20" />
        </div>
      </div>

      <div className="mb-6 flex justify-between px-10">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-2.5 w-10" />
      </div>

      <div className="px-2">
        <Skeleton className="h-7.5 w-full rounded-md" />
      </div>
    </DashCard>
  );
};
