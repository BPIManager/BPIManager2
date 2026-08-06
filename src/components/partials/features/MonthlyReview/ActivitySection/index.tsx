"use client";

import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { useChartColors } from "@/hooks/common/useChartColors";
import ActivitySectionUI from "./ui";

interface Props {
  activity: MonthlyReviewData["activity"];
  granularity: "month" | "year";
}

const ActivitySection = ({ activity, granularity }: Props) => {
  const [ref, inView] = useInView(0.1);
  const colors = useChartColors();
  const { t, tFormat } = useTranslation();
  const { totalKeys, totalScratches, byDayOfWeek, byHour } = activity;

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

  return (
    <ActivitySectionUI
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      granularity={granularity}
      inView={inView}
      activity={activity}
      dowData={dowData}
      hourData={hourData}
      maxDow={maxDow}
      tooltipStyle={tooltipStyle}
      hasNoKeyScratchData={totalKeys === 0 && totalScratches === 0}
      primaryColor={colors.primary}
      formatHourLabel={(l) =>
        tFormat("monthlyReview.activity.hourUnit", { h: String(l) })
      }
    />
  );
};

export default ActivitySection;
