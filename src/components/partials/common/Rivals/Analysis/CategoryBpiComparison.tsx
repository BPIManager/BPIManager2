import { cn } from "@/lib/utils";
import { RADAR_COLORS } from "@/constants/iidx/radars";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RivalCategoryStat } from "@/hooks/social/useRivalAnalysis";

const CategoryBpiComparison = ({
  stats,
  rivalName,
}: {
  stats: RivalCategoryStat[];
  rivalName?: string;
}) => {
  const { t } = useTranslation();
  const maxAbs = Math.max(
    ...stats.flatMap((s) =>
      [s.myTotal, s.rivalTotal]
        .filter((v): v is number => v !== null)
        .map(Math.abs),
    ),
    1,
  );

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg p-5 shadow-sm">
      <h3 className="mb-1 text-[10px] font-black uppercase tracking-widest text-bpim-muted">
        {t("arenaAnalysis.categoryComparison")}
      </h3>
      <p className="mb-4 text-[10px] text-bpim-muted">
        {t("arenaAnalysis.categoryDesc")}
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ cat, myTotal, rivalTotal, songCount }) => {
          const color = RADAR_COLORS[cat];
          const diff =
            myTotal !== null && rivalTotal !== null
              ? myTotal - rivalTotal
              : null;
          const myPct =
            myTotal !== null
              ? Math.min(100, (Math.abs(myTotal) / maxAbs) * 100)
              : 0;
          const rivalPct =
            rivalTotal !== null
              ? Math.min(100, (Math.abs(rivalTotal) / maxAbs) * 100)
              : 0;

          return (
            <div key={cat} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold" style={{ color }}>
                    {cat}
                  </span>
                  <span className="text-[10px] text-bpim-muted">
                    ({songCount}曲)
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-bpim-muted">
                    {t("arenaAnalysis.mine")}:{" "}
                    <span className="font-black text-bpim-primary">
                      {myTotal !== null ? myTotal.toFixed(2) : "-"}
                    </span>
                  </span>
                  <span className="text-bpim-muted">
                    {rivalName ?? t("rivals.analysis.rival")}:{" "}
                    <span className="font-black text-bpim-warning">
                      {rivalTotal !== null ? rivalTotal.toFixed(2) : "-"}
                    </span>
                  </span>
                  {diff !== null && (
                    <span
                      className={cn(
                        "font-black",
                        diff >= 0 ? "text-green-400" : "text-red-400",
                      )}
                    >
                      {diff >= 0 ? "+" : ""}
                      {diff.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative flex h-4 w-full flex-col gap-0.5 overflow-hidden rounded-sm bg-bpim-surface-2">
                <div
                  className="absolute top-0 h-2 rounded-t-sm transition-all"
                  style={{
                    width: `${myPct}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                  }}
                />
                <div
                  className="absolute bottom-0 h-2 rounded-b-sm transition-all"
                  style={{
                    width: `${rivalPct}%`,
                    backgroundColor: color,
                    opacity: 0.35,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-bpim-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-85" />
          {t("arenaAnalysis.mine")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-35" />
          {rivalName ?? t("rivals.analysis.rival")}
        </span>
      </div>
    </div>
  );
};

export default CategoryBpiComparison;
