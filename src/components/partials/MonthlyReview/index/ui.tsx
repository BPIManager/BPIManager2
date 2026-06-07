"use client";

import { StarfieldBackground } from "@/components/ui/starfield-background";
import { TitleSection } from "../TitleSection";
import { HeroSection } from "../HeroSection";
import { TopSongsSection } from "../TopSongsSection";
import { ActivitySection } from "../ActivitySection";
import { RivalsSection } from "../RivalsSection";
import { ArenaSection } from "../ArenaSection";
import { RadarSection } from "../RadarSection";
import { FooterSection } from "../FooterSection";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";

const BASE_SPEED = 0.6;

interface Props {
  data: MonthlyReviewData;
  speedRef: React.RefObject<number>;
}

export const MonthlyReviewViewUI = ({ data, speedRef }: Props) => (
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
