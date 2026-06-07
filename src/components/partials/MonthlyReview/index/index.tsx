"use client";

import { useEffect, useRef } from "react";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { MonthlyReviewViewUI } from "./ui";

const BASE_SPEED = 0.6;
const MAX_SPEED = 14;

interface Props {
  data: MonthlyReviewData;
}

export const MonthlyReviewView = ({ data }: Props) => {
  const speedRef = useRef(BASE_SPEED);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = Date.now();

    const onScroll = () => {
      const now = Date.now();
      const dy = Math.abs(window.scrollY - lastY);
      const dt = Math.max(now - lastT, 8);
      const velocity = dy / dt;
      speedRef.current = Math.min(BASE_SPEED + velocity * 18, MAX_SPEED);
      lastY = window.scrollY;
      lastT = now;
    };

    let rafId: number;
    const decay = () => {
      const diff = speedRef.current - BASE_SPEED;
      if (diff > 0.01) speedRef.current = BASE_SPEED + diff * 0.93;
      else speedRef.current = BASE_SPEED;
      rafId = requestAnimationFrame(decay);
    };
    rafId = requestAnimationFrame(decay);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <MonthlyReviewViewUI data={data} speedRef={speedRef} />;
};
