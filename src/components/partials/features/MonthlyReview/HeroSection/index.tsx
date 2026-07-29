"use client";

import { useEffect, useRef } from "react";
import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import dayjs from "@/lib/dayjs";
import { HeroSectionUI } from "./ui";

interface Props {
  bpi: MonthlyReviewData["bpi"];
}

export const HeroSection = ({ bpi }: Props) => {
  const [ref, inView] = useInView(0.15);
  const rafRef = useRef<number | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isPositive = bpi.diff >= 0;
  const accent = isPositive ? "#34d399" : "#f87171";

  useEffect(() => {
    if (!inView || !spanRef.current) return;
    const target = bpi.diff;
    const dur = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const v = e * target;
      if (spanRef.current)
        spanRef.current.textContent = (v >= 0 ? "+" : "") + v.toFixed(2);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [inView, bpi.diff]);

  const chartData = bpi.history.map((h) => ({
    d: dayjs(h.date).format("M/D"),
    v: h.value,
  }));

  return (
    <HeroSectionUI
      bpi={bpi}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      accent={accent}
      isPositive={isPositive}
      chartData={chartData}
      spanRef={spanRef}
    />
  );
};
