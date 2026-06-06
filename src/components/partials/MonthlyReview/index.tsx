"use client";

import { useEffect, useRef } from "react";
import { StarfieldBackground } from "@/components/ui/starfield-background";
import { TitleSection } from "./TitleSection";
import { HeroSection } from "./HeroSection";
import { TopSongsSection } from "./TopSongsSection";
import { ActivitySection } from "./ActivitySection";
import { RivalsSection } from "./RivalsSection";
import { ArenaSection } from "./ArenaSection";
import { RadarSection } from "./RadarSection";
import { FooterSection } from "./FooterSection";
import type { MonthlyReviewData } from "@/pages/api/v1/users/[userId]/stats/monthly-review";

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
      const velocity = dy / dt; // px/ms
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

  return (
    <div style={{ background: "#0a0a0f" }}>
      <StarfieldBackground
        speedRef={speedRef}
        count={500}
        speed={BASE_SPEED}
        twinkle
      />

      <div className="relative z-10">
        <TitleSection
          month={data.month}
          bpiDiff={data.bpi.diff}
          granularity={data.granularity}
        />
        <HeroSection bpi={data.bpi} />
        <TopSongsSection topSongs={data.topSongs} />
        <ActivitySection
          activity={data.activity}
          granularity={data.granularity}
        />
        {data.radarGrowth && data.radarGrowth.length > 0 && (
          <RadarSection radarGrowth={data.radarGrowth} />
        )}
        <RivalsSection
          rivals={data.rivals}
          ranking={data.rivalsGrowthRanking}
          timeline={data.rivalsGrowthTimeline}
          granularity={data.granularity}
        />
        {data.arena && <ArenaSection arena={data.arena} />}
        <FooterSection data={data} />
      </div>
    </div>
  );
};
