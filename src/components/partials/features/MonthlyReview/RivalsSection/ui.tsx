"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ChevronDown } from "lucide-react";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { SectionCard } from "../SectionCard";
import { styles, PAGE } from "./constants";
import { GrowthRankList } from "./GrowthRankList";
import { RivalCard } from "./RivalCard";
import { RivalsGrowthChartSection } from "./RivalsGrowthChartSection";

interface RivalsSectionData {
  rivals: MonthlyReviewData["rivals"];
  ranking: MonthlyReviewData["rivalsGrowthRanking"];
  timeline: MonthlyReviewData["rivalsGrowthTimeline"];
}

interface RivalsSectionChart {
  hasChart: boolean;
  hiddenKeys: Set<string>;
  onToggleKey: (uid: string) => void;
}

interface RivalsSectionRankSummary {
  viewerAbsRank: number;
  viewerRateRank: number;
  totalParticipants: number;
}

interface RivalsSectionLabels {
  noRivalsTitle: string;
  noRivalsDesc: string;
  sectionTitle: string;
  rivalsSummary: string;
}

interface Props {
  data: RivalsSectionData;
  chart: RivalsSectionChart;
  rankSummary: RivalsSectionRankSummary;
  labels: RivalsSectionLabels;
  granularity: "month" | "year";
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  isEmpty: boolean;
}

export const RivalsSectionUI = ({
  data,
  chart,
  rankSummary,
  labels,
  granularity,
  inView,
  sectionRef,
  isEmpty,
}: Props) => {
  const { rivals, ranking, timeline } = data;
  const { hasChart, hiddenKeys, onToggleKey } = chart;
  const { viewerAbsRank, viewerRateRank, totalParticipants } = rankSummary;
  const { noRivalsTitle, noRivalsDesc, sectionTitle, rivalsSummary } = labels;
  const [visible, setVisible] = useState(PAGE);
  const { t } = useTranslation();

  return (
    <>
      <style>{styles}</style>
      <section ref={sectionRef} className="relative w-full">
        <div className="flex min-h-[30vh] w-full flex-col items-center justify-end pb-8 pt-24">
          <h2
            className="text-center font-black tracking-[0.2em] uppercase"
            style={{
              fontSize: "clamp(1.25rem, 4vw, 2rem)",
              color: "rgba(255,255,255,0.5)",
              animation: inView ? "titleIn 0.8s ease-out both" : "none",
            }}
          >
            {sectionTitle}
          </h2>
          {!isEmpty && rivals.length > 0 && (
            <p
              className="mt-8 max-w-lg text-center text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {rivalsSummary}
            </p>
          )}
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center gap-3 px-5 pb-24 text-center">
            <div
              className="w-full max-w-md rounded-2xl px-8 py-8"
              style={{
                background: "rgba(8,8,14,0.55)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className="mb-2 font-bold"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}
              >
                {noRivalsTitle}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: "0.8rem",
                  lineHeight: 1.65,
                }}
              >
                {noRivalsDesc}
              </p>
            </div>
          </div>
        )}

        {!isEmpty && hasChart && (
          <RivalsGrowthChartSection
            ranking={ranking}
            timeline={timeline!}
            hiddenKeys={hiddenKeys}
            onToggleKey={onToggleKey}
            viewerAbsRank={viewerAbsRank}
            viewerRateRank={viewerRateRank}
            totalParticipants={totalParticipants}
            granularity={granularity}
            inView={inView}
          />
        )}

        {!isEmpty && (
          <div className="flex w-full flex-col items-center px-6 py-10">
            <SectionCard
              className="max-w-2xl flex flex-col gap-8"
              style={{
                animation: inView ? "rivalIn 0.5s ease-out 0.1s both" : "none",
              }}
            >
              {ranking && (
                <div>
                  <p
                    className="mb-4 text-xs font-bold tracking-[0.3em] uppercase"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {t("monthlyReview.rivals.growthRanking")}
                  </p>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <GrowthRankList
                      title={t("monthlyReview.rivals.growthAbsTitle")}
                      entries={ranking.byAbsGrowth}
                      valueKey="bpiGrowth"
                      formatValue={(e) =>
                        `${e.bpiGrowth >= 0 ? "+" : ""}${e.bpiGrowth.toFixed(2)}`
                      }
                    />
                    {ranking.byGrowthRate.length > 0 && (
                      <GrowthRankList
                        title={t("monthlyReview.rivals.growthRateTitle")}
                        entries={ranking.byGrowthRate}
                        valueKey="growthRate"
                        formatValue={(e) =>
                          `${(e.growthRate ?? 0) >= 0 ? "+" : ""}${(e.growthRate ?? 0).toFixed(1)}%`
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {rivals.slice(0, visible).map((rival, i) => (
                  <RivalCard
                    key={rival.userId}
                    rival={rival}
                    index={i}
                    inView={inView}
                  />
                ))}

                {visible < rivals.length && (
                  <button
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-colors"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      border: "1px dashed rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    {t("monthlyReview.seeMore")} ({rivals.length - visible})
                  </button>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </section>
    </>
  );
};
