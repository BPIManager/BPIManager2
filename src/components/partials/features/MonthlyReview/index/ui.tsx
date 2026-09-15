"use client";

import { StarfieldBackground } from "@/components/ui/starfield-background";
import TitleSection from "../TitleSection";
import HeroSection from "../HeroSection";
import TopSongsSection from "../TopSongsSection";
import ActivitySection from "../ActivitySection";
import RivalsSection from "../RivalsSection";
import ArenaSection from "../ArenaSection";
import RadarSection from "../RadarSection";
import FooterSection from "../FooterSection";
import type {
  MonthlyReviewBpi,
  MonthlyReviewTopSongs,
  MonthlyReviewActivity,
  MonthlyReviewRivals,
  MonthlyArena,
  RadarGrowthEntry,
} from "@/types/stats/monthlyReview";

const BASE_SPEED = 0.6;

export interface MonthlyReviewViewSections {
  month: string;
  version: string;
  granularity: "month" | "year" | "version";
  bpi: MonthlyReviewBpi | undefined;
  topSongs: MonthlyReviewTopSongs | undefined;
  activity: MonthlyReviewActivity | undefined;
  rivals: MonthlyReviewRivals | undefined;
  arena: MonthlyArena | null;
  radarGrowth: RadarGrowthEntry[] | null;
}

interface Props {
  data: MonthlyReviewViewSections;
  speedRef: React.RefObject<number>;
}

const MonthlyReviewViewUI = ({ data, speedRef }: Props) => (
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
        version={data.version}
        bpiDiff={data.bpi?.diff}
        granularity={data.granularity}
      />
      {data.bpi && <HeroSection bpi={data.bpi} />}
      {data.topSongs && <TopSongsSection topSongs={data.topSongs} />}
      {data.activity && (
        <ActivitySection
          activity={data.activity}
          granularity={data.granularity}
        />
      )}
      {data.radarGrowth && data.radarGrowth.length > 0 && (
        <RadarSection radarGrowth={data.radarGrowth} />
      )}
      {data.rivals && (
        <RivalsSection
          rivals={data.rivals.rivals}
          ranking={data.rivals.rivalsGrowthRanking}
          timeline={data.rivals.rivalsGrowthTimeline}
          granularity={data.granularity}
        />
      )}
      {data.arena && <ArenaSection arena={data.arena} />}
      <FooterSection
        month={data.month}
        version={data.version}
        granularity={data.granularity}
        bpi={data.bpi}
        topSongs={data.topSongs}
      />
    </div>
  </div>
);

export default MonthlyReviewViewUI;
