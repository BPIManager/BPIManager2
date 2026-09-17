import { useState } from "react";
import type { TopSongImproved } from "@/types/stats/monthlyReview";
import { useTranslation } from "@/hooks/common/useTranslation";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DIFF_COLORS, DIFF_LABELS, PAGE, ScoreSubline } from "./_shared";

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

function ImprovedRankedListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ImprovedRankedList({
  title,
  icon,
  accent,
  songs,
  inView,
  colDelay,
  configSlot,
  isComparing,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  songs: TopSongImproved[];
  inView: boolean;
  colDelay: number;
  configSlot?: React.ReactNode;
  isComparing?: boolean;
  emptyMessage?: string;
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
        {configSlot}
      </div>
      {isComparing ? (
        <ImprovedRankedListSkeleton />
      ) : songs.length === 0 && emptyMessage ? (
        <p
          className="rounded-xl px-4 py-6 text-center text-xs leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px dashed rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {emptyMessage}
        </p>
      ) : (
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
      )}
      {!isComparing && visible < songs.length && (
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
