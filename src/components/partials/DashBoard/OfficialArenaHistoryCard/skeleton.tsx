import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const OfficialArenaHistoryCardSkeleton = () => (
  <DashCard>
    <div className="mb-4 flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-40 rounded-md" />
    </div>
    <Skeleton className="mb-6 h-3 w-56" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="mb-4">
        <Skeleton className="mb-2 h-3 w-20" />
        <Skeleton className="h-36 w-full rounded-lg" />
      </div>
    ))}
  </DashCard>
);
