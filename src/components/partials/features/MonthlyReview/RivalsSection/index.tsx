"use client";

import { useState } from "react";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import RivalsSectionUI from "./ui";

interface Props {
  rivals: MonthlyReviewData["rivals"];
  ranking: MonthlyReviewData["rivalsGrowthRanking"];
  timeline: MonthlyReviewData["rivalsGrowthTimeline"];
  granularity?: "month" | "year";
}

const RivalsSection = ({
  rivals,
  ranking,
  timeline,
  granularity = "month",
}: Props) => {
  const [ref, inView] = useInView(0.1);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

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

  return (
    <RivalsSectionUI
      data={{ rivals, ranking, timeline }}
      chart={{ hasChart, hiddenKeys, onToggleKey: toggleKey }}
      rankSummary={{ viewerAbsRank, viewerRateRank, totalParticipants }}
      granularity={granularity}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      isEmpty={isEmpty}
    />
  );
};

export default RivalsSection;
