import { Skeleton } from "@/components/ui/skeleton";
import { LogNavigatorSkeleton } from "../LogsNav/skeleton";

export const LogsDetailContentSkeleton = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <LogNavigatorSkeleton />

      <div className="flex flex-col gap-6">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 w-1/2 rounded-md" />
          <Skeleton className="h-10 w-1/2 rounded-md" />
        </div>

        <Skeleton className="h-20 w-full rounded-xl" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>

        <div className="flex flex-col gap-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
