import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const RivalHeaderSkeleton = () => (
  <div className="flex w-full flex-col gap-4">
    <div className="flex flex-col items-center gap-4 md:flex-row">
      <Skeleton className="h-24 w-24 rounded-full shrink-0" />
      <div className="flex flex-1 flex-col items-center gap-2 md:items-start">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-full md:w-24" />
    </div>
    <Skeleton className="h-16 w-full rounded-lg" />
  </div>
);

export const RivalBodySkeleton = () => (
  <div className="flex flex-col gap-6">
    <Separator className="bg-bpim-surface-2/60" />
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-[250px] w-full rounded-xl md:h-[300px]" />
    </div>
    <Skeleton className="h-12 w-full rounded-xl" />
  </div>
);
