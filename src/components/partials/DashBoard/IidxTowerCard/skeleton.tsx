import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const IidxTowerCardSkeleton = () => (
  <DashCard>
    <Skeleton className="mb-4 h-4 w-32" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  </DashCard>
);
