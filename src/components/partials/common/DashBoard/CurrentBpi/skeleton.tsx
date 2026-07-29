import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";

export const CurrentBpiSkeleton = () => (
  <DashCard>
    <div className="flex items-start justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="size-7 rounded-lg" />
    </div>

    <div className="mt-4 flex flex-row items-end gap-8">
      <Skeleton className="h-12 w-32 md:h-14 md:w-44" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>

    <div className="mt-5">
      <Skeleton className="h-[42px] w-full rounded-lg" />
    </div>
  </DashCard>
);
