import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

const OptimizerProgressSkeleton = () => (
  <DashCard>
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-12" />
    </div>
    <div className="mt-4 flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  </DashCard>
);

export default OptimizerProgressSkeleton;
