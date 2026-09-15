"use client";

import type {
  MonthlyReviewData,
  ArenaVersionHistoryEntry,
} from "@/types/stats/monthlyReview";
import { SectionCard } from "../SectionCard";
import { useTranslation } from "@/hooks/common/useTranslation";
import { usePeriodPhrase } from "../usePeriodPhrase";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { ARENA_CLASS_STYLES as CLASS_STYLES } from "@/constants/iidx/arenaRankStyles";

const styles = `
  @keyframes arenaPop  { 0%{opacity:0;transform:scale(0.6) rotate(-8deg)} 70%{transform:scale(1.08) rotate(1deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes arenaGlow { 0%,100%{box-shadow:0 0 60px var(--glow),0 0 120px var(--glow2)} 50%{box-shadow:0 0 100px var(--glow),0 0 200px var(--glow2)} }
  @keyframes statIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes titleIn   { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
`;

interface Props {
  arena: MonthlyReviewData["arena"];
  versionHistory: ArenaVersionHistoryEntry[];
  granularity: "month" | "year" | "version";
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  a1Ref: React.RefObject<HTMLSpanElement | null>;
}

const ArenaSectionUI = ({
  arena,
  versionHistory,
  granularity,
  inView,
  sectionRef,
  a1Ref,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const period = usePeriodPhrase(granularity);
  const s = CLASS_STYLES[arena?.bestClass ?? "B5"] ?? CLASS_STYLES["B5"];

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 py-24"
      >
        <h2
          className="mb-16 text-center font-black tracking-[0.2em] uppercase"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 2rem)",
            color: "rgba(255,255,255,0.5)",
            animation: inView ? "titleIn 0.8s ease-out both" : "none",
          }}
        >
          {t("monthlyReview.arena.sectionHeading")}
        </h2>

        {arena && (
          <SectionCard
            className="max-w-sm flex flex-col items-center"
            style={{
              animation: inView ? "statIn 0.6s ease-out 0.1s both" : "none",
            }}
          >
            <div
              className="flex flex-col items-center justify-center rounded-3xl"
              style={
                {
                  width: "clamp(160px, 30vw, 260px)",
                  height: "clamp(160px, 30vw, 260px)",
                  border: `2px solid ${s.border}`,
                  background: `radial-gradient(ellipse at center, ${s.glow2} 0%, rgba(8,8,14,0.6) 70%)`,
                  "--glow": s.glow,
                  "--glow2": s.glow2,
                  animation: inView
                    ? "arenaPop 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both, arenaGlow 3s ease-in-out 1.2s infinite"
                    : "none",
                } as React.CSSProperties
              }
            >
              <span
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(4rem, 12vw, 8rem)",
                  color: s.text,
                  textShadow: `0 0 40px ${s.glow}`,
                }}
              >
                {arena.bestClass}
              </span>
              {arena.bestRank != null && (
                <span
                  style={{ color: `${s.text}88`, fontSize: "0.9rem", marginTop: 4 }}
                >
                  #{arena.bestRank}
                </span>
              )}
            </div>

            {arena.maxA1Continue != null && (
              <div
                className="mt-8 flex flex-col items-center gap-1 border-t w-full pt-6"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  animation: inView ? "statIn 0.6s ease-out 0.8s both" : "none",
                }}
              >
                <span
                  ref={a1Ref}
                  className="font-black tabular-nums"
                  style={{
                    fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                    color: "#fde047",
                  }}
                >
                  0
                </span>
                <span
                  className="text-[10px] tracking-widest uppercase"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {t("monthlyReview.arena.maxA1Continue")}
                </span>
              </div>
            )}

            <p
              className="mt-6 text-center text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.35)",
                animation: inView ? "statIn 0.6s ease-out 1s both" : "none",
              }}
            >
              {[
                tFormat("monthlyReview.arena.summaryText", { period, class: arena.bestClass }),
                arena.bestRank != null ? tFormat("monthlyReview.arena.summaryRank", { rank: String(arena.bestRank) }) : null,
                arena.maxA1Continue != null && arena.maxA1Continue > 0
                  ? tFormat("monthlyReview.arena.summaryA1", { count: String(arena.maxA1Continue) })
                  : null,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
          </SectionCard>
        )}

        {versionHistory.length > 0 && (
          <SectionCard
            className="mt-8 max-w-sm flex flex-col gap-3"
            style={{
              animation: inView ? "statIn 0.6s ease-out 1.1s both" : "none",
            }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {t("monthlyReview.arena.versionHistoryTitle")}
            </p>
            <div className="flex flex-col gap-1.5">
              {versionHistory.map((v) => {
                const vs = CLASS_STYLES[v.arenaClass] ?? CLASS_STYLES["B5"];
                return (
                  <div
                    key={v.version}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {v.version === "INF" ? "INF" : `IIDX ${getVersionNameFromNumber(v.version)}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-black"
                        style={{ color: vs.text, width: 28, textAlign: "right" }}
                      >
                        {v.arenaClass}
                      </span>
                      <span
                        className="text-[10px] tabular-nums"
                        style={{ color: "rgba(255,255,255,0.3)", width: 48, textAlign: "right" }}
                      >
                        {v.arenaRank != null ? `#${v.arenaRank}` : ""}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {t("monthlyReview.arena.versionHistoryNote")}
            </p>
          </SectionCard>
        )}
      </section>
    </>
  );
};

export default ArenaSectionUI;
