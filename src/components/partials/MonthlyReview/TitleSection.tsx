"use client";

import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import dayjs from "@/lib/dayjs";

const styles = `
  @keyframes titleDrop  { from{opacity:0;transform:translateY(-40px) scale(1.1)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes subSlide   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scrollPulse{ 0%,100%{opacity:0.2;transform:translateY(0)} 50%{opacity:0.6;transform:translateY(6px)} }
  @keyframes lineExpand { from{width:0} to{width:min(200px,40vw)} }
`;

interface Props {
  month: string; // YYYY-MM or YYYY
  bpiDiff: number;
  granularity: "month" | "year";
}

export const TitleSection = ({ month, bpiDiff, granularity }: Props) => {
  const [ref, inView] = useInView(0.1);
  const { t } = useTranslation();
  const isYearMode = granularity === "year";

  const periodLabel = isYearMode
    ? dayjs.tz(`${month}-01-01`).format("YYYY年")
    : dayjs.tz(`${month}-01`).format("YYYY年M月");

  const isPositive = bpiDiff >= 0;
  const diffColor = isPositive ? "#34d399" : "#f87171";
  const subtitle = isYearMode
    ? t("monthlyReview.subtitle.year")
    : t("monthlyReview.subtitle.month");

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-6"
      >
        <h1
          className="text-center font-black leading-none"
          style={{
            fontSize: "clamp(3rem, 14vw, 10rem)",
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 0 120px rgba(255,255,255,0.08)",
            animation: inView
              ? "titleDrop 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s both"
              : "none",
          }}
        >
          {periodLabel}
        </h1>

        <div
          className="my-8 h-px"
          style={{
            width: "min(200px,40vw)",
            background: "rgba(255,255,255,0.15)",
            animation: inView ? "lineExpand 0.8s ease-out 0.5s both" : "none",
          }}
        />

        <p
          className="text-center font-semibold"
          style={{
            fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)",
            color: diffColor,
            textShadow: `0 0 40px ${diffColor}44`,
            animation: inView ? "subSlide 0.6s ease-out 0.6s both" : "none",
          }}
        >
          {subtitle}
        </p>
      </section>
    </>
  );
};
