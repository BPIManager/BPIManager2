export function SongCardSkeleton() {
  return (
    <div className="rounded-lg border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="h-3 w-20 rounded bg-bpim-overlay" />
          <div className="h-4 w-3/4 rounded bg-bpim-overlay" />
          <div className="flex gap-1.5">
            <div className="h-5 w-20 rounded bg-bpim-overlay" />
            <div className="h-5 w-20 rounded bg-bpim-overlay" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="h-3 w-10 rounded bg-bpim-overlay" />
          <div className="h-5 w-14 rounded bg-bpim-overlay" />
          <div className="h-3 w-16 rounded bg-bpim-overlay" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-32 rounded bg-bpim-overlay" />
        <div className="h-3 w-20 rounded bg-bpim-overlay" />
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 rounded bg-bpim-overlay" />
            <div className="h-5 w-28 rounded bg-bpim-overlay" />
          </div>
          <div className="h-3 w-36 rounded bg-bpim-overlay" />
        </div>
        <div className="h-8 w-44 rounded bg-bpim-overlay" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SongCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
