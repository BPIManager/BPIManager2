"use client";

import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { SectionCard } from "../SectionCard";
import { useTranslation } from "@/hooks/common/useTranslation";

const styles = `
  @keyframes arenaPop  { 0%{opacity:0;transform:scale(0.6) rotate(-8deg)} 70%{transform:scale(1.08) rotate(1deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
  @keyframes arenaGlow { 0%,100%{box-shadow:0 0 60px var(--glow),0 0 120px var(--glow2)} 50%{box-shadow:0 0 100px var(--glow),0 0 200px var(--glow2)} }
  @keyframes statIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes titleIn   { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
`;

const CLASS_STYLES: Record<
  string,
  { glow: string; glow2: string; text: string; border: string }
> = {
  A1: {
    glow: "rgba(253,224,71,0.6)",
    glow2: "rgba(253,224,71,0.2)",
    text: "#fde047",
    border: "rgba(253,224,71,0.5)",
  },
  A2: {
    glow: "rgba(251,191,36,0.5)",
    glow2: "rgba(251,191,36,0.15)",
    text: "#fbbf24",
    border: "rgba(251,191,36,0.4)",
  },
  A3: {
    glow: "rgba(249,115,22,0.5)",
    glow2: "rgba(249,115,22,0.15)",
    text: "#f97316",
    border: "rgba(249,115,22,0.4)",
  },
  A4: {
    glow: "rgba(234,88,12,0.4)",
    glow2: "rgba(234,88,12,0.1)",
    text: "#ea580c",
    border: "rgba(234,88,12,0.35)",
  },
  A5: {
    glow: "rgba(194,65,12,0.4)",
    glow2: "rgba(194,65,12,0.1)",
    text: "#c2410c",
    border: "rgba(194,65,12,0.3)",
  },
  B1: {
    glow: "rgba(56,189,248,0.5)",
    glow2: "rgba(56,189,248,0.15)",
    text: "#38bdf8",
    border: "rgba(56,189,248,0.4)",
  },
  B2: {
    glow: "rgba(14,165,233,0.4)",
    glow2: "rgba(14,165,233,0.1)",
    text: "#0ea5e9",
    border: "rgba(14,165,233,0.35)",
  },
  B3: {
    glow: "rgba(59,130,246,0.4)",
    glow2: "rgba(59,130,246,0.1)",
    text: "#3b82f6",
    border: "rgba(59,130,246,0.3)",
  },
  B4: {
    glow: "rgba(99,102,241,0.3)",
    glow2: "rgba(99,102,241,0.08)",
    text: "#6366f1",
    border: "rgba(99,102,241,0.25)",
  },
  B5: {
    glow: "rgba(148,163,184,0.25)",
    glow2: "rgba(148,163,184,0.05)",
    text: "#94a3b8",
    border: "rgba(148,163,184,0.2)",
  },
};

interface Props {
  arena: NonNullable<MonthlyReviewData["arena"]>;
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  a1Ref: React.RefObject<HTMLSpanElement | null>;
}

export const ArenaSectionUI = ({ arena, inView, sectionRef, a1Ref }: Props) => {
  const { t, tFormat } = useTranslation();
  const s = CLASS_STYLES[arena.bestClass] ?? CLASS_STYLES["B5"];

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
              tFormat("monthlyReview.arena.summaryText", { class: arena.bestClass }),
              arena.bestRank != null ? tFormat("monthlyReview.arena.summaryRank", { rank: String(arena.bestRank) }) : null,
              arena.maxA1Continue != null && arena.maxA1Continue > 0
                ? tFormat("monthlyReview.arena.summaryA1", { count: String(arena.maxA1Continue) })
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        </SectionCard>
      </section>
    </>
  );
};
