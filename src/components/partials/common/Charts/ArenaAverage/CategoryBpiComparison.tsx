import { cn } from "@/lib/utils";
import type { RadarCategory } from "@/types/stats/radar";
import { RADAR_COLORS } from "@/constants/iidx/radars";
import { useTranslation } from "@/hooks/common/useTranslation";

type CategoryBpiStat = {
  cat: RadarCategory;
  arenaTotal: number | null;
  userTotal: number | null;
  songCount: number;
};

const CategoryBpiComparison = ({
  stats,
  rank,
  user,
  userLoading,
}: {
  stats: CategoryBpiStat[];
  rank: string;
  user: { userId: string } | null | undefined;
  userLoading: boolean;
}) => {
  const { t } = useTranslation();
  const maxAbs = Math.max(
    ...stats.flatMap((s) =>
      [s.arenaTotal, s.userTotal]
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
        {!user && t("arenaAnalysis.loginForMine")}
        {user && userLoading && t("arenaAnalysis.loading")}
      </p>
      <div className="flex flex-col gap-3">
        {stats.map(({ cat, arenaTotal, userTotal, songCount }) => {
          const color = RADAR_COLORS[cat];
          const diff =
            arenaTotal !== null && userTotal !== null
              ? userTotal - arenaTotal
              : null;
          const arenaPct =
            arenaTotal !== null
              ? Math.min(100, (Math.abs(arenaTotal) / maxAbs) * 100)
              : 0;
          const userPct =
            userTotal !== null
              ? Math.min(100, (Math.abs(userTotal) / maxAbs) * 100)
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
                    ({songCount}{t("filter.songUnit")})
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-bpim-muted">
                    {rank}:{" "}
                    <span className="font-black text-bpim-text">
                      {arenaTotal !== null ? arenaTotal.toFixed(2) : "-"}
                    </span>
                  </span>
                  {user && !userLoading && (
                    <>
                      <span className="text-bpim-muted">
                        {t("arenaAnalysis.mine")}:{" "}
                        <span className="font-black text-bpim-primary">
                          {userTotal !== null ? userTotal.toFixed(2) : "-"}
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
                    </>
                  )}
                </div>
              </div>
              <div className="relative flex h-4 w-full overflow-hidden rounded-sm bg-bpim-surface-2">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${arenaPct}%`,
                    backgroundColor: color,
                    opacity: 0.35,
                  }}
                />
                {user && !userLoading && userTotal !== null && (
                  <div
                    className="absolute top-0 h-full rounded-sm transition-all"
                    style={{
                      width: `${userPct}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-bpim-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-35" />
          {rank} {t("arenaAnalysis.rankAvg")}
        </span>
        {user && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-bpim-primary opacity-85" />
            {t("arenaAnalysis.mine")}
          </span>
        )}
      </div>
    </div>
  );
};

export default CategoryBpiComparison;
