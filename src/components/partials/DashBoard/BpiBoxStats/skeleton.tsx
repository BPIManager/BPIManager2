import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const BpiBoxStatsSkeleton = () => {
  return (
    <DashCard className="h-[420px]">
      <Skeleton className="mb-8 h-4 w-[180px]" />

      <div className="relative mb-6 flex h-[260px] w-full items-end justify-between px-2">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5">
            <Skeleton
              className="w-2 rounded-sm opacity-20"
              style={{ height: `${Math.random() * 30 + 5}%` }}
            />
            <Skeleton
              className="w-2 rounded-sm opacity-40"
              style={{ height: `${Math.random() * 20 + 10}%` }}
            />
            <Skeleton
              className="w-2 rounded-sm opacity-20"
              style={{ height: `${Math.random() * 15 + 5}%` }}
            />
          </div>
        ))}
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
