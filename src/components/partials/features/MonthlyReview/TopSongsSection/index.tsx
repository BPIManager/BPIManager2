"use client";

import { useRouter } from "next/router";
import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { usePeriodPhrase } from "../usePeriodPhrase";
import TopSongsSectionUI from "./ui";

interface Props {
  topSongs: MonthlyReviewData["topSongs"];
  granularity: "month" | "year" | "version";
  isComparing: boolean;
  onCompareVersionChange?: (version: string) => void;
  excludeNewPlays?: boolean;
  onExcludeNewPlaysChange?: (excludeNewPlays: boolean) => void;
}

const TopSongsSection = ({
  topSongs,
  granularity,
  isComparing,
  onCompareVersionChange,
  excludeNewPlays,
  onExcludeNewPlaysChange,
}: Props) => {
  const [ref, inView] = useInView(0.1);
  const { tFormat } = useTranslation();
  const router = useRouter();
  const currentVersion = (router.query.version as string) || undefined;
  const period = usePeriodPhrase(granularity);
  const { topBpiSongs, topImprovedSongs } = topSongs;

  const top1 = topBpiSongs[0];
  const topImp = topImprovedSongs[0];

  const summary = [
    top1
      ? tFormat("monthlyReview.topSongs.summaryTop", {
          period,
          title: top1.title,
          bpi: top1.bpi.toFixed(2),
        })
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
      currentVersion={currentVersion}
      isComparing={isComparing}
      onCompareVersionChange={onCompareVersionChange}
      excludeNewPlays={excludeNewPlays}
      onExcludeNewPlaysChange={onExcludeNewPlaysChange}
    />
  );
};

export default TopSongsSection;
