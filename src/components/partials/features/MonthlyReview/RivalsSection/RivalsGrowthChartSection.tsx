import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { GrowthChart, PALETTE } from "../GrowthChart";

export function RivalsGrowthChartSection({
  ranking,
  timeline,
  hiddenKeys,
  onToggleKey,
  viewerAbsRank,
  viewerRateRank,
  totalParticipants,
  granularity,
  inView,
}: {
  ranking: MonthlyReviewData["rivalsGrowthRanking"];
  timeline: NonNullable<MonthlyReviewData["rivalsGrowthTimeline"]>;
  hiddenKeys: Set<string>;
  onToggleKey: (uid: string) => void;
  viewerAbsRank: number;
  viewerRateRank: number;
  totalParticipants: number;
  granularity: "month" | "year";
  inView: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        animation: inView ? "chartFade 0.8s ease-out 0.2s both" : "none",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(56,189,248,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 50% at 50% 90%, rgba(52,211,153,0.05) 0%, transparent 70%)",
            "linear-gradient(to bottom, rgba(8,8,14,0.7) 0%, rgba(8,8,14,0.2) 40%, rgba(8,8,14,0.2) 60%, rgba(8,8,14,0.85) 100%)",
          ].join(", "),
        }}
      />

      <div className="relative px-4 pb-4 pt-6 sm:px-10">
        {totalParticipants > 1 &&
          (viewerRateRank >= 0 || viewerAbsRank >= 0) && (
            <div className="mb-6 flex flex-wrap justify-center gap-8">
              {viewerAbsRank >= 0 && (
                <div className="flex flex-col items-center text-center">
                  <p
                    className="mb-0.5 text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {t("monthlyReview.rivals.bpiGrowthRank")}
                  </p>
                  <p
                    className="font-black tabular-nums leading-none"
                    style={{
                      fontSize: "clamp(2rem, 6vw, 3.5rem)",
                      color: "#34d399",
                    }}
                  >
                    {viewerAbsRank + 1}
                    <span
                      className="ml-1 text-base font-bold"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      / {totalParticipants}
                    </span>
                  </p>
                </div>
              )}
              {viewerRateRank >= 0 && (
                <div className="flex flex-col items-center text-center">
                  <p
                    className="mb-0.5 text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {t("monthlyReview.rivals.growthRateRank")}
                  </p>
                  <p
                    className="font-black tabular-nums leading-none"
                    style={{
                      fontSize: "clamp(2rem, 6vw, 3.5rem)",
                      color: "#38bdf8",
                    }}
                  >
                    {viewerRateRank + 1}
                    <span
                      className="ml-1 text-base font-bold"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      / {ranking!.byGrowthRate.length}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p
            className="text-xs font-bold tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {t("monthlyReview.rivals.growthTimeline")}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          {timeline.map((p, i) => {
            const color = PALETTE[i] ?? PALETTE[PALETTE.length - 1];
            const hidden = hiddenKeys.has(p.userId);
            return (
              <button
                key={p.userId}
                onClick={() => onToggleKey(p.userId)}
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] transition-all"
                style={{
                  color: hidden
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(255,255,255,0.65)",
                  background: hidden ? "transparent" : `${color}14`,
                  border: `1px solid ${hidden ? "rgba(255,255,255,0.06)" : `${color}40`}`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-4 rounded-full"
                  style={{
                    background: hidden ? "rgba(255,255,255,0.15)" : color,
                    opacity: p.isViewer ? 1 : 0.8,
                  }}
                />
                {p.userName}
              </button>
            );
          })}
        </div>

        <GrowthChart
          participants={timeline}
          hiddenKeys={hiddenKeys}
          granularity={granularity}
        />
      </div>
    </div>
  );
}
