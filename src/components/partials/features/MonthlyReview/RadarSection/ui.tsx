"use client";

import { useTranslation } from "@/hooks/common/useTranslation";
import type { RadarGrowthEntry } from "@/types/stats/monthlyReview";
import { SectionCard } from "../SectionCard";
import { styles, ELEMENT_COLORS, ELEMENT_LABELS } from "./constants";
import { ElementPanel } from "./ElementPanel";
import { RadarComparisonChart } from "./RadarComparisonChart";

interface Props {
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  sortedAll: RadarGrowthEntry[];
  sortedWithSongs: RadarGrowthEntry[];
  activeTab: number;
  onTabChange: (i: number) => void;
}

export const RadarSectionUI = ({
  inView,
  sectionRef,
  sortedAll,
  sortedWithSongs,
  activeTab,
  onTabChange,
}: Props) => {
  const { t } = useTranslation();
  const currentEntry = sortedWithSongs[activeTab] ?? sortedWithSongs[0];

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-24"
      >
        <h2
          className="mb-4 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "titleIn 0.8s ease-out both" : "none",
          }}
        >
          {t("monthlyReview.radar.sectionTitle")}
        </h2>
        <p
          className="mb-8 text-center text-xs"
          style={{
            color: "rgba(255,255,255,0.25)",
            animation: inView ? "radarFade 0.6s ease-out 0.1s both" : "none",
          }}
        >
          {t("monthlyReview.radar.sectionDesc")}
        </p>

        <SectionCard
          className="max-w-2xl flex flex-col items-center gap-8"
          style={{
            animation: inView ? "radarFade 0.6s ease-out 0.25s both" : "none",
          }}
        >
          <RadarComparisonChart entries={sortedAll} inView={inView} />

          {sortedWithSongs.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {sortedWithSongs.map((entry, i) => {
                  const accent = ELEMENT_COLORS[entry.element] ?? "#94a3b8";
                  const isActive = i === activeTab;
                  return (
                    <button
                      key={entry.element}
                      onClick={() => onTabChange(i)}
                      className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                      style={{
                        background: isActive ? `${accent}22` : "transparent",
                        border: `1px solid ${isActive ? accent : `${accent}44`}`,
                        color: isActive ? accent : `${accent}77`,
                      }}
                    >
                      {ELEMENT_LABELS[entry.element]}
                      <span className="ml-1.5 opacity-70">
                        {entry.totalDiff >= 0 ? "+" : ""}
                        {entry.totalDiff.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className="w-full border-t pt-6"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                {currentEntry && (
                  <ElementPanel
                    key={currentEntry.element}
                    entry={currentEntry}
                    inView={inView}
                  />
                )}
              </div>
            </>
          )}
        </SectionCard>
      </section>
    </>
  );
};
