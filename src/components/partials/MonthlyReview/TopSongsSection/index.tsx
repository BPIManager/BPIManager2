"use client";

import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { TopSongsSectionUI } from "./ui";

interface Props {
  topSongs: MonthlyReviewData["topSongs"];
}

export const TopSongsSection = ({ topSongs }: Props) => {
  const [ref, inView] = useInView(0.1);
  const { topBpiSongs, topImprovedSongs } = topSongs;

  const top1 = topBpiSongs[0];
  const topImp = topImprovedSongs[0];

  const summary = [
    top1
      ? `今月の最高BPI曲は「${top1.title}」で ${top1.bpi.toFixed(2)} を記録。`
      : null,
    topImp && topImp.diff > 0
      ? `最も伸びた曲は「${topImp.title}」で +${topImp.diff.toFixed(2)} の上昇でした。`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TopSongsSectionUI
      topSongs={topSongs}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      summary={summary}
    />
  );
};
