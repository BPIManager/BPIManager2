"use client";

import { useState } from "react";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { RadarSectionUI } from "./ui";

interface Props {
  radarGrowth: MonthlyReviewData["radarGrowth"];
}

export const RadarSection = ({ radarGrowth }: Props) => {
  const [ref, inView] = useInView(0.1);
  const [activeTab, setActiveTab] = useState(0);

  if (!radarGrowth || radarGrowth.length === 0) return null;

  const sortedAll = [...radarGrowth].sort((a, b) => b.totalDiff - a.totalDiff);
  const sortedWithSongs = sortedAll.filter((e) => e.songs.length > 0);

  return (
    <RadarSectionUI
      radarGrowth={radarGrowth}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      sortedAll={sortedAll}
      sortedWithSongs={sortedWithSongs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
};
