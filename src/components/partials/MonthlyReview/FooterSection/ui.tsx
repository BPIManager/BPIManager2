"use client";

import { ArrowLeft, Share2, Users } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import Link from "next/link";
import { useRef } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { SectionCard } from "../SectionCard";
import type { RivalMonthlyReviewEntry } from "@/hooks/social/useRivalMonthlyReviewSummary";

const styles = `
  @keyframes footerFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes autoScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .rival-track { animation: autoScroll 24s linear infinite; }
  .rival-track:hover { animation-play-state: paused; }
`;

interface Props {
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  twitterUrl: string;
  onBack: () => void;
  rivals: RivalMonthlyReviewEntry[];
  rivalsLoading: boolean;
  currentMonth: string | undefined;
  currentVersion: string;
}

function BpiDiff({ start, end }: { start: number; end: number }) {
  const diff = Math.round((end - start) * 100) / 100;
  const color = diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "rgba(255,255,255,0.4)";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {start.toFixed(1)}
        <span className="mx-1" style={{ color: "rgba(255,255,255,0.25)" }}>→</span>
        {end.toFixed(1)}
      </span>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {diff >= 0 ? "+" : ""}
        {diff.toFixed(2)}
      </span>
    </div>
  );
}

function RivalCard({
  rival,
  currentMonth,
  currentVersion,
}: {
  rival: RivalMonthlyReviewEntry;
  currentMonth: string;
  currentVersion: string;
}) {
  return (
    <Link
      href={`/users/${rival.userId}/monthly-review/${currentMonth}?version=${currentVersion}`}
      className="flex flex-col items-center gap-2 rounded-2xl px-4 py-3 transition-all hover:scale-105 shrink-0"
      style={{
        width: 120,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      tabIndex={-1}
    >
      <Avatar size="lg">
        <AvatarImage src={rival.profileImage ?? undefined} alt={rival.userName} />
        <AvatarFallback
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
        >
          {rival.userName.slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <span
        className="w-full truncate text-center text-xs font-semibold"
        style={{ color: "rgba(255,255,255,0.75)" }}
      >
        {rival.userName}
      </span>
      <BpiDiff start={rival.bpiStart} end={rival.bpiEnd} />
    </Link>
  );
}

export const FooterSectionUI = ({
  inView,
  sectionRef,
  twitterUrl,
  onBack,
  rivals,
  rivalsLoading,
  currentMonth,
  currentVersion,
}: Props) => {
  const { t } = useTranslation();
  const showRivals = !rivalsLoading && rivals.length > 0 && !!currentMonth;
  const doubled = showRivals ? [...rivals, ...rivals] : [];

  return (
    <>
      <style>{styles}</style>
      <section
        ref={sectionRef}
        className="flex w-full flex-col items-center justify-center gap-8 px-6 pb-24 pt-12"
      >
        <SectionCard
          className="max-w-sm flex flex-col items-center gap-6"
          style={{
            animation: inView ? "footerFade 0.6s ease-out both" : "none",
          }}
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "rgba(29,161,242,0.15)",
                border: "1px solid rgba(29,161,242,0.4)",
                color: "#1da1f2",
              }}
            >
              <Share2 className="h-4 w-4" />
              {t("monthlyReview.footer.shareX")}
            </a>

            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("monthlyReview.footer.back")}
            </button>
          </div>
        </SectionCard>

        {showRivals && (
          <div
            className="w-full max-w-2xl flex flex-col gap-3"
            style={{
              animation: inView ? "footerFade 0.8s ease-out 0.15s both" : "none",
            }}
          >
            <div className="flex items-center gap-2 px-1">
              <Users className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {t("monthlyReview.footer.checkRivals")}
              </span>
            </div>

            <div className="overflow-hidden">
              <div className="rival-track flex gap-3" style={{ width: "max-content" }}>
                {doubled.map((rival, i) => (
                  <RivalCard
                    key={`${rival.userId}-${i}`}
                    rival={rival}
                    currentMonth={currentMonth!}
                    currentVersion={currentVersion}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};
