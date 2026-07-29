import { Skeleton } from "@/components/ui/skeleton";

export const GlobalRankingContainerSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
};
