"use client";

import { useState } from "react";
import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { RivalsSectionUI } from "./ui";

interface Props {
  rivals: MonthlyReviewData["rivals"];
  ranking: MonthlyReviewData["rivalsGrowthRanking"];
  timeline: MonthlyReviewData["rivalsGrowthTimeline"];
  granularity?: "month" | "year";
}

export const RivalsSection = ({
  rivals,
  ranking,
  timeline,
  granularity = "month",
}: Props) => {
  const [ref, inView] = useInView(0.1);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const { t, tFormat } = useTranslation();

  const isEmpty = rivals.length === 0 && !ranking;

  const toggleKey = (uid: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const viewerRateRank =
    ranking?.byGrowthRate.findIndex((e) => e.isViewer) ?? -1;
  const viewerAbsRank = ranking?.byAbsGrowth.findIndex((e) => e.isViewer) ?? -1;
  const totalParticipants = ranking?.byAbsGrowth.length ?? 0;
  const hasChart = !!(timeline && timeline.length > 1);

  const totalWins = rivals.reduce((sum, r) => sum + r.newWins, 0);
  const totalLosses = rivals.reduce((sum, r) => sum + r.newLosses, 0);
  const summaryParts: string[] = [];
  if (totalWins > 0)
    summaryParts.push(tFormat("monthlyReview.rivals.summaryWins", { count: String(totalWins) }));
  if (totalLosses > 0)
    summaryParts.push(tFormat("monthlyReview.rivals.summaryLosses", { count: String(totalLosses) }));
  if (summaryParts.length === 0)
    summaryParts.push(t("monthlyReview.rivals.summaryNoChange"));
  const rivalsSummary = summaryParts.join(" ");

  return (
    <RivalsSectionUI
      rivals={rivals}
      ranking={ranking}
      timeline={timeline}
      granularity={granularity}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      isEmpty={isEmpty}
      hasChart={hasChart}
      hiddenKeys={hiddenKeys}
      viewerAbsRank={viewerAbsRank}
      viewerRateRank={viewerRateRank}
      totalParticipants={totalParticipants}
      onToggleKey={toggleKey}
      noRivalsTitle={t("monthlyReview.rivals.noRivalsTitle")}
      noRivalsDesc={t("monthlyReview.rivals.noRivalsDesc")}
      sectionTitle={t("monthlyReview.rivals.sectionTitle")}
      rivalsSummary={rivalsSummary}
    />
  );
};
