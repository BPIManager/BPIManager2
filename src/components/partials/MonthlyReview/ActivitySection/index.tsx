"use client";

import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { useChartColors } from "@/hooks/common/useChartColors";
import { useCountUp } from "./functions";
import { ActivitySectionUI } from "./ui";

interface Props {
  activity: MonthlyReviewData["activity"];
  granularity: "month" | "year";
}

export const ActivitySection = ({ activity, granularity }: Props) => {
  const [ref, inView] = useInView(0.1);
  const colors = useChartColors();
  const { t, tFormat } = useTranslation();
  const {
    totalKeys,
    totalScratches,
    playDays,
    updatedSongs,
    byDayOfWeek,
    byHour,
  } = activity;

  const keysRef = useCountUp(totalKeys, inView, 0.2);
  const scratchRef = useCountUp(totalScratches, inView, 0.35);
  const daysRef = useCountUp(playDays, inView, 0.5);
  const songsRef = useCountUp(updatedSongs, inView, 0.6);

  const { towerRanking } = activity;
  const dowLabels = t("monthlyReview.activity.dowLabels").split(",");
  const dowData = byDayOfWeek.map((d) => ({
    label: dowLabels[d.day] ?? String(d.day),
    count: d.count,
  }));
  const hourData = byHour.map((h) => ({
    label: String(h.hour),
    count: h.count,
  }));
  const maxDow = Math.max(...dowData.map((d) => d.count), 1);

  const tooltipStyle: React.CSSProperties = {
    background: "rgba(8,8,14,0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    fontSize: 11,
    color: "#ffffff",
  };

  const isMonth = granularity === "month";
  const bestDowIdx = dowData.reduce(
    (best, d, i) => (d.count > dowData[best].count ? i : best),
    0,
  );
  const bestDowLabel = dowLabels[bestDowIdx] ?? "";
  const summaryParts: string[] = [
    tFormat("monthlyReview.activity.summaryPlayed", {
      days: playDays,
      songs: updatedSongs,
    }),
    tFormat("monthlyReview.activity.summaryBestDow", {
      day: isMonth ? `${bestDowLabel}曜` : bestDowLabel,
    }),
  ];
  if (towerRanking) {
    summaryParts.push(
      tFormat("monthlyReview.activity.summaryKeysRank", {
        rank: towerRanking.keysRank,
        total: towerRanking.totalUsers,
      }),
    );
  }
  const summary = summaryParts.join(" ");

  return (
    <ActivitySectionUI
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      inView={inView}
      keysRef={keysRef}
      scratchRef={scratchRef}
      daysRef={daysRef}
      songsRef={songsRef}
      summary={summary}
      sectionTitle={t("monthlyReview.activity.sectionTitle")}
      activity={activity}
      dowData={dowData}
      hourData={hourData}
      maxDow={maxDow}
      tooltipStyle={tooltipStyle}
      hasNoKeyScratchData={totalKeys === 0 && totalScratches === 0}
      primaryColor={colors.primary}
      noKeyScratchTitle={t("monthlyReview.activity.noKeyScratchTitle")}
      noKeyScratchDesc={t("monthlyReview.activity.noKeyScratchDesc")}
      bestDaysTitle={t("monthlyReview.activity.bestDaysTitle")}
      bestGrowthDayLabel={t("monthlyReview.activity.bestGrowthDay")}
      bestKeysDayLabel={t("monthlyReview.activity.bestKeysDay")}
      bestScratchDayLabel={t("monthlyReview.activity.bestScratchDay")}
      byDayOfWeekTitle={t("monthlyReview.activity.byDayOfWeek")}
      byHourTitle={t("monthlyReview.activity.byHour")}
      formatHourLabel={(l) =>
        tFormat("monthlyReview.activity.hourUnit", { h: String(l) })
      }
    />
  );
};
