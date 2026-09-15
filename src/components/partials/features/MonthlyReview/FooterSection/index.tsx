"use client";

import { useRouter } from "next/router";
import { useInView } from "@/hooks/common/useInView";
import type {
  MonthlyReviewBpi,
  MonthlyReviewTopSongs,
} from "@/types/stats/monthlyReview";
import { useRivalMonthlyReviewSummary } from "@/hooks/social/useRivalMonthlyReviewSummary";
import { useMonthlyReviewMonthlySummary } from "@/hooks/stats/useMonthlyReviewMonthlySummary";
import FooterSectionUI from "./ui";

interface Props {
  month: string;
  version: string;
  granularity: "month" | "year" | "version";
  bpi: MonthlyReviewBpi | undefined;
  topSongs: MonthlyReviewTopSongs | undefined;
}

const FooterSection = ({ month, version, granularity, bpi, topSongs }: Props) => {
  const router = useRouter();
  const [ref, inView] = useInView(0.1);
  const userId = router.query.userId as string | undefined;
  const routeMonth = router.query.month as string | undefined;

  const { rivals, isLoading: rivalsLoading } = useRivalMonthlyReviewSummary({
    userId,
    month: routeMonth,
    version,
  });

  const { data: monthlySummary } = useMonthlyReviewMonthlySummary(userId, version);
  const monthlyLinks = (monthlySummary?.months ?? []).filter(
    (m) => m.month !== routeMonth,
  );

  const periodText =
    granularity === "version"
      ? `${version === "INF" ? "INF" : `IIDX${version}`}全体`
      : month;

  const shareText = [
    `【${periodText}の振り返り】`,
    bpi
      ? `総合BPI: ${bpi.start.toFixed(2)} → ${bpi.end.toFixed(2)} (${bpi.diff >= 0 ? "+" : ""}${bpi.diff.toFixed(2)})`
      : null,
    topSongs?.topImprovedSongs[0]
      ? `最伸び: ${topSongs.topImprovedSongs[0].title} +${topSongs.topImprovedSongs[0].diff.toFixed(2)}`
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
      currentMonth={routeMonth}
      currentVersion={version}
      userId={userId}
      monthlyLinks={monthlyLinks}
    />
  );
};

export default FooterSection;
