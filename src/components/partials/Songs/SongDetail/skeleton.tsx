import { Skeleton } from "@/components/ui/skeleton";

export function SongDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-bpim-border bg-bpim-overlay/40 px-3 py-2 flex flex-col gap-1"
              >
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-20 shrink-0" />
                <Skeleton className="flex-1 h-1.5 rounded-full" />
                <Skeleton className="h-2.5 w-5" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-[280px] shrink-0 flex items-center justify-center">
          <Skeleton className="h-[280px] w-[280px] rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1 rounded-lg border border-bpim-border bg-bpim-surface p-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-8 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
