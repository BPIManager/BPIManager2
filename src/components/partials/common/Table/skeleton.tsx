"use client";

import { Skeleton } from "@/components/ui/skeleton";

const SongItemSkeleton = () => {
  return (
    <div className="mb-2 w-full border-l-4 border-bpim-border bg-bpim-surface-2/60">
      <div className="grid grid-cols-[1fr_auto] gap-1">
        <div className="flex flex-col gap-2 px-3 py-2">
          <Skeleton className="h-3.5 w-[60%]" />

          <div className="mt-1 flex items-center gap-3">
            <Skeleton className="h-[18px] w-6 rounded-sm" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>

        <div className="flex items-center bg-bpim-bg/20 p-2 lg:p-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-2 w-4" />
              <Skeleton className="h-5 w-10" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-2 w-4" />
              <Skeleton className="h-5 w-11" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SongListSkeleton = () => {
  return (
    <div className="w-full p-2">
      {Array.from({ length: 15 }).map((_, i) => (
        <SongItemSkeleton key={i} />
      ))}
    </div>
  );
};
