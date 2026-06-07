"use client";

import { useState } from "react";
import type {
  MonthlyReviewData,
  TopSong,
  TopSongImproved,
} from "@/types/stats/monthlyReview";
import { useTranslation } from "@/hooks/common/useTranslation";
import { getRankDetail } from "@/constants/djRank";
import { ChevronDown, Trophy, TrendingUp } from "lucide-react";
import { SectionCard } from "../SectionCard";

const styles = `
  @keyframes titleIn  { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
  @keyframes rowIn    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes moreIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`;

const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};
const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

const PAGE = 5;

function RankLabel({ rank }: { rank: number }) {
  const { tFormat } = useTranslation();
  return (
    <span
      className="text-[9px] tabular-nums"
      style={{ color: "rgba(255,255,255,0.3)" }}
    >
      {tFormat("monthlyReview.topSongs.rankLabel", { rank: String(rank) })}
    </span>
  );
}

function ScoreSubline({
  song,
  accent,
}: {
  song: TopSong;
  accent: string;
}) {
  const maxEx = song.notes * 2;
  const rd = getRankDetail(song.exScore, maxEx);
  const aboveAaa = song.exScore - Math.ceil(maxEx * (8 / 9));
  const isAaaOrAbove = aboveAaa >= 0;
  return (
    <div className="flex items-center gap-2 pl-7 flex-wrap">
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {song.exScore.toLocaleString()}
      </span>
      {isAaaOrAbove ? (
        <span
          className="rounded px-1 py-0.5 text-[9px] font-bold"
          style={{ background: `${accent}22`, color: accent }}
        >
          AAA +{aboveAaa}
        </span>
      ) : (
        <span
          className="rounded px-1 py-0.5 text-[9px] font-bold"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {rd.label} +{rd.surplus}
        </span>
      )}
      {song.rank > 0 && (
        <RankLabel rank={song.rank} />
      )}
    </div>
  );
}

function BpiSongRow({
  rank,
  song,
  accent,
  delay,
}: {
  rank: number;
  song: TopSong;
  accent: string;
  delay: number;
}) {
  const diffColor = DIFF_COLORS[song.difficulty] ?? "#94a3b8";
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: `rowIn 0.4s ease-out ${delay}s both`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-5 shrink-0 text-right text-xs font-black tabular-nums"
          style={{ color: rank <= 3 ? accent : "rgba(255,255,255,0.3)" }}
        >
          {rank}
        </span>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
          style={{ background: `${diffColor}33`, color: diffColor }}
        >
          {DIFF_LABELS[song.difficulty] ?? song.difficulty}
        </span>
        <span
          className="flex-1 text-sm font-semibold leading-snug"
          style={{ color: "rgba(255,255,255,0.92)", wordBreak: "break-all" }}
        >
          {song.title}
        </span>
        <span
          className="shrink-0 font-mono text-sm font-bold tabular-nums"
          style={{ color: accent }}
        >
          {song.bpi.toFixed(2)}
        </span>
      </div>
      <ScoreSubline song={song} accent={accent} />
    </div>
  );
}

function ImprovedSongRow({
  rank,
  song,
  accent,
  delay,
}: {
  rank: number;
  song: TopSongImproved;
  accent: string;
  delay: number;
}) {
  const diffColor = DIFF_COLORS[song.difficulty] ?? "#94a3b8";
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: `rowIn 0.4s ease-out ${delay}s both`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-5 shrink-0 text-right text-xs font-black tabular-nums"
          style={{ color: rank <= 3 ? accent : "rgba(255,255,255,0.3)" }}
        >
          {rank}
        </span>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
          style={{ background: `${diffColor}33`, color: diffColor }}
        >
          {DIFF_LABELS[song.difficulty] ?? song.difficulty}
        </span>
        <span
          className="flex-1 text-sm font-semibold leading-snug"
          style={{ color: "rgba(255,255,255,0.92)", wordBreak: "break-all" }}
        >
          {song.title}
        </span>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1">
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {song.bpiBefore.toFixed(2)}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>→</span>
            <span
              className="font-mono text-sm font-bold tabular-nums"
              style={{ color: accent }}
            >
              {song.bpiAfter.toFixed(2)}
            </span>
          </div>
          <span
            className="font-mono text-xs font-bold tabular-nums"
            style={{ color: `${accent}dd` }}
          >
            +{song.diff.toFixed(2)}
          </span>
        </div>
      </div>
      <ScoreSubline song={song} accent={accent} />
    </div>
  );
}

function BpiRankedList({
  title,
  icon,
  accent,
  songs,
  inView,
  colDelay,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  songs: TopSong[];
  inView: boolean;
  colDelay: number;
}) {
  const [visible, setVisible] = useState(PAGE);
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div
        className="flex items-center gap-2"
        style={{
          animation: inView
            ? `titleIn 0.6s ease-out ${colDelay}s both`
            : "none",
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: accent }}
        >
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {songs.slice(0, visible).map((s, i) => (
          <BpiSongRow
            key={s.songId}
            rank={i + 1}
            song={s}
            accent={accent}
            delay={inView ? colDelay + i * 0.04 : 0}
          />
        ))}
      </div>
      {visible < songs.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors"
          style={{
            color: `${accent}99`,
            border: `1px dashed ${accent}33`,
            animation: inView
              ? `moreIn 0.4s ease-out ${colDelay + 0.25}s both`
              : "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = `${accent}0d`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {t("monthlyReview.seeMore")} ({songs.length - visible})
        </button>
      )}
    </div>
  );
}

function ImprovedRankedList({
  title,
  icon,
  accent,
  songs,
  inView,
  colDelay,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  songs: TopSongImproved[];
  inView: boolean;
  colDelay: number;
}) {
  const [visible, setVisible] = useState(PAGE);
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div
        className="flex items-center gap-2"
        style={{
          animation: inView
            ? `titleIn 0.6s ease-out ${colDelay}s both`
            : "none",
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: accent }}
        >
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {songs.slice(0, visible).map((s, i) => (
          <ImprovedSongRow
            key={s.songId}
            rank={i + 1}
            song={s}
            accent={accent}
            delay={inView ? colDelay + i * 0.04 : 0}
          />
        ))}
      </div>
      {visible < songs.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors"
          style={{
            color: `${accent}99`,
            border: `1px dashed ${accent}33`,
            animation: inView
              ? `moreIn 0.4s ease-out ${colDelay + 0.25}s both`
              : "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = `${accent}0d`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {t("monthlyReview.seeMore")} ({songs.length - visible})
        </button>
      )}
    </div>
  );
}

interface Props {
  topSongs: MonthlyReviewData["topSongs"];
  inView: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
  summary: string;
}

export const TopSongsSectionUI = ({
  topSongs,
  inView,
  sectionRef,
  summary,
}: Props) => {
  const { t } = useTranslation();
  const { topBpiSongs, topImprovedSongs } = topSongs;

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
