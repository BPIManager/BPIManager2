"use client";

import { useRouter } from "next/router";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { useRivalMonthlyReviewSummary } from "@/hooks/social/useRivalMonthlyReviewSummary";
import { FooterSectionUI } from "./ui";

interface Props {
  data: MonthlyReviewData;
}

export const FooterSection = ({ data }: Props) => {
  const router = useRouter();
  const [ref, inView] = useInView(0.1);
  const userId = router.query.userId as string | undefined;
  const month = router.query.month as string | undefined;

  const { rivals, isLoading: rivalsLoading } = useRivalMonthlyReviewSummary({
    userId,
    month,
    version: data.version,
  });

  const shareText = [
    `【${data.month}の振り返り】`,
    `総合BPI: ${data.bpi.start.toFixed(2)} → ${data.bpi.end.toFixed(2)} (${data.bpi.diff >= 0 ? "+" : ""}${data.bpi.diff.toFixed(2)})`,
    data.topSongs.topImprovedSongs[0]
      ? `最伸び: ${data.topSongs.topImprovedSongs[0].title} +${data.topSongs.topImprovedSongs[0].diff.toFixed(2)}`
      : null,
    "#IIDX #BPIM2",
  ]
    .filter(Boolean)
    .join("\n");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`;

  return (
    <FooterSectionUI
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      twitterUrl={twitterUrl}
      onBack={() => router.back()}
      rivals={rivals}
      rivalsLoading={rivalsLoading}
      currentMonth={month}
      currentVersion={data.version}
    />
  );
};
