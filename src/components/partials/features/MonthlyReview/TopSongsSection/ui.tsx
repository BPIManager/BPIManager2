"use client";

import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { useTranslation } from "@/hooks/common/useTranslation";
import { Trophy, TrendingUp } from "lucide-react";
import { SectionCard } from "../SectionCard";
import CompareVersionConfig from "../CompareVersionConfig";
import { styles } from "./_shared";
import { BpiRankedList } from "./BpiRankedList";
import { ImprovedRankedList } from "./ImprovedRankedList";

interface Props {
  topSongs: MonthlyReviewData["topSongs"];
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  summary: string;
  currentVersion: string | undefined;
  isComparing: boolean;
  onCompareVersionChange?: (version: string) => void;
  excludeNewPlays?: boolean;
  onExcludeNewPlaysChange?: (excludeNewPlays: boolean) => void;
}

const TopSongsSectionUI = ({
  topSongs,
  inView,
  sectionRef,
  summary,
  currentVersion,
  isComparing,
  onCompareVersionChange,
  excludeNewPlays,
  onExcludeNewPlaysChange,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const { topBpiSongs, topImprovedSongs, compareVersion } = topSongs;

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-24"
      >
        <h2
          className="mb-12 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "titleIn 0.8s ease-out both" : "none",
          }}
        >
          {t("monthlyReview.topSongs.sectionTitle")}
        </h2>

        <SectionCard
          className="max-w-4xl"
          style={{
            animation: inView ? "rowIn 0.6s ease-out 0.1s both" : "none",
          }}
        >
          <div className="flex flex-col gap-10 sm:flex-row sm:gap-8">
            <BpiRankedList
              title={t("monthlyReview.topSongs.highestBpi")}
              icon={<Trophy className="h-4 w-4" />}
              accent="#f59e0b"
              songs={topBpiSongs}
              inView={inView}
              colDelay={0.1}
            />
            <div
              className="hidden w-px sm:block"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <ImprovedRankedList
              title={t("monthlyReview.topSongs.mostImproved")}
              icon={<TrendingUp className="h-4 w-4" />}
              accent="#34d399"
              songs={topImprovedSongs}
              inView={inView}
              colDelay={0.2}
              isComparing={isComparing}
              configSlot={
                (compareVersion && onCompareVersionChange) ||
                onExcludeNewPlaysChange ? (
                  <CompareVersionConfig
                    currentVersion={currentVersion}
                    compareVersion={compareVersion ?? undefined}
                    onChange={onCompareVersionChange}
                    excludeNewPlays={excludeNewPlays}
                    onExcludeNewPlaysChange={onExcludeNewPlaysChange}
                  />
                ) : undefined
              }
              emptyMessage={
                compareVersion
                  ? tFormat("monthlyReview.topSongs.noComparisonData", {
                      compareLabel: compareVersion === "INF" ? "INF" : `IIDX${compareVersion}`,
                    })
                  : undefined
              }
            />
          </div>

          {summary && (
            <p
              className="mt-10 text-center text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.35)",
                animation: inView ? "rowIn 0.6s ease-out 0.5s both" : "none",
              }}
            >
              {summary}
            </p>
          )}
        </SectionCard>
      </section>
    </>
  );
};

export default TopSongsSectionUI;
