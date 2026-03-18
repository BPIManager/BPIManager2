import { Skeleton } from "@/components/ui/skeleton";

export const PageHeaderSkeleton = () => (
  <header className="relative mb-6 overflow-hidden border-b border-bpim-border bg-bpim-bg px-4 pt-8 pb-6 md:pt-12 md:pb-8">
    <div
      className="pointer-events-none absolute -top-[20%] -left-[10%] h-[150%] w-[40%] bg-bpim-primary-dim/5 blur-[120px]"
      aria-hidden="true"
    />

    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-full max-w-[240px] md:h-10 md:max-w-[320px]" />
          </div>

          <div className="hidden sm:block sm:pl-[52px]">
            <Skeleton className="h-4 w-full max-w-[450px]" />
          </div>
        </div>

        <div className="hidden pb-1 sm:block">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  </header>
);
