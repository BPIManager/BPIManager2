"use client";

import { useState } from "react";
import { useInView } from "@/hooks/common/useInView";
import type {
  MonthlyReviewData,
  TopSong,
  TopSongImproved,
} from "@/pages/api/v1/users/[userId]/stats/monthly-review";
import { ChevronDown, Trophy, TrendingUp } from "lucide-react";

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
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        animation: `rowIn 0.4s ease-out ${delay}s both`,
      }}
    >
      <span
        className="w-6 shrink-0 text-right text-xs font-black tabular-nums"
        style={{ color: rank <= 3 ? accent : "rgba(255,255,255,0.2)" }}
      >
        {rank}
      </span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
        style={{ background: `${diffColor}22`, color: diffColor }}
      >
        {DIFF_LABELS[song.difficulty] ?? song.difficulty}
      </span>
      <span
        className="flex-1 truncate text-sm font-semibold"
        style={{ color: "rgba(255,255,255,0.82)" }}
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
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        animation: `rowIn 0.4s ease-out ${delay}s both`,
      }}
    >
      <span
        className="w-6 shrink-0 text-right text-xs font-black tabular-nums"
        style={{ color: rank <= 3 ? accent : "rgba(255,255,255,0.2)" }}
      >
        {rank}
      </span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black"
        style={{ background: `${diffColor}22`, color: diffColor }}
      >
        {DIFF_LABELS[song.difficulty] ?? song.difficulty}
      </span>
      <span
        className="flex-1 truncate text-sm font-semibold"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {song.title}
      </span>

      <span
        className="shrink-0 font-mono text-xs tabular-nums"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {song.bpiBefore.toFixed(2)}
      </span>
      <span
        className="shrink-0 text-[10px]"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        →
      </span>
      <span
        className="shrink-0 font-mono text-sm font-bold tabular-nums"
        style={{ color: accent }}
      >
        {song.bpiAfter.toFixed(2)}
      </span>
      <span
        className="shrink-0 text-xs font-bold"
        style={{ color: `${accent}cc` }}
      >
        +{song.diff.toFixed(2)}
      </span>
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
          もっとみる ({songs.length - visible})
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
          もっとみる ({songs.length - visible})
        </button>
      )}
    </div>
  );
}

interface Props {
  topSongs: MonthlyReviewData["topSongs"];
}

export const TopSongsSection = ({ topSongs }: Props) => {
  const [ref, inView] = useInView(0.1);
  const { topBpiSongs, topImprovedSongs } = topSongs;

  const top1 = topBpiSongs[0];
  const topImp = topImprovedSongs[0];

  const summary = [
    top1
      ? `今月の最高BPI曲は「${top1.title}」で ${top1.bpi.toFixed(2)} を記録。`
      : null,
    topImp && topImp.diff > 0
      ? `最も伸びた曲は「${topImp.title}」で +${topImp.diff.toFixed(2)} の上昇でした。`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{styles}</style>
      <section
        ref={ref as React.RefObject<HTMLDivElement>}
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
          楽曲ハイライト
        </h2>

        <div className="flex w-full max-w-4xl flex-col gap-10 sm:flex-row sm:gap-8">
          <BpiRankedList
            title="最高BPI"
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
            title="最も伸びた曲"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="#34d399"
            songs={topImprovedSongs}
            inView={inView}
            colDelay={0.2}
          />
        </div>

        {summary && (
          <p
            className="mt-10 max-w-lg text-center text-sm leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.35)",
              animation: inView ? "rowIn 0.6s ease-out 0.5s both" : "none",
            }}
          >
            {summary}
          </p>
        )}
      </section>
    </>
  );
};
