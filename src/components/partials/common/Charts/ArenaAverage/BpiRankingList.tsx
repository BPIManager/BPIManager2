import { cn } from "@/lib/utils";
import { getBpiBarColor, type ArenaSongPoint } from "@/hooks/metrics/useArenaAnalysis";

const BpiRankingList = ({
  title,
  songs,
  maxAbsBpi,
  reverse = false,
}: {
  title: string;
  songs: ArenaSongPoint[];
  maxAbsBpi: number;
  reverse?: boolean;
}) => (
  <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
    <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
      {title}
    </h3>
    <div className="flex flex-col gap-1.5">
      {songs.map((song, i) => {
        const pct = Math.min(100, (Math.abs(song.bpi) / maxAbsBpi) * 100);
        return (
          <div key={i} className="flex items-center gap-2">
            {!reverse && (
              <span className="w-4 shrink-0 text-right text-[10px] font-bold text-bpim-muted">
                {i + 1}
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold text-bpim-text">
                  {song.title}
                </span>
                <span
                  className="shrink-0 font-mono text-[11px] font-black"
                  style={{
                    color: reverse ? "#64748b" : getBpiBarColor(song.bpi),
                  }}
                >
                  {song.bpi.toFixed(1)}
                </span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bpim-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    reverse && "ml-auto bg-slate-500",
                  )}
                  style={{
                    width: `${pct}%`,
                    ...(reverse
                      ? {}
                      : { backgroundColor: getBpiBarColor(song.bpi) }),
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default BpiRankingList;
