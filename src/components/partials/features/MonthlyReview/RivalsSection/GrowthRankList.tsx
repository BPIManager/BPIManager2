import type { RivalBpiGrowthEntry } from "@/types/stats/monthlyReview";

export function GrowthRankList({
  title,
  entries,
  valueKey,
  formatValue,
}: {
  title: string;
  entries: RivalBpiGrowthEntry[];
  valueKey: "bpiGrowth" | "growthRate";
  formatValue: (e: RivalBpiGrowthEntry) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[10px] font-bold tracking-[0.25em] uppercase"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {title}
      </p>
      {entries.map((e, i) => {
        const isPositive = (e[valueKey] ?? 0) >= 0;
        const accent = isPositive ? "#34d399" : "#f87171";
        return (
          <div
            key={e.userId}
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: e.isViewer
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.02)",
              border: e.isViewer
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              className="w-5 shrink-0 text-right text-xs font-black tabular-nums"
              style={{ color: i < 3 ? accent : "rgba(255,255,255,0.2)" }}
            >
              {i + 1}
            </span>
            <span
              className="flex-1 truncate text-xs font-semibold"
              style={{
                color: e.isViewer
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.65)",
              }}
            >
              {e.userName}
              {e.isViewer && (
                <span
                  className="ml-1.5 text-[9px] font-bold"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  YOU
                </span>
              )}
            </span>
            <span
              className="shrink-0 font-mono text-xs font-bold tabular-nums"
              style={{ color: accent }}
            >
              {formatValue(e)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
