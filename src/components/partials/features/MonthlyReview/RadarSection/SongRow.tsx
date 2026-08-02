import type { TopSongImproved } from "@/types/stats/monthlyReview";
import { DIFF_COLORS, DIFF_LABELS } from "./constants";

export function SongRow({
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
        animation: `radarRow 0.4s ease-out ${delay}s both`,
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
      </div>
      <div className="flex items-center gap-1.5 pl-7">
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {song.bpiBefore.toFixed(2)}
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          →
        </span>
        <span
          className="font-mono text-sm font-bold tabular-nums"
          style={{ color: accent }}
        >
          {song.bpiAfter.toFixed(2)}
        </span>
        <span
          className="ml-1 text-xs font-bold"
          style={{ color: `${accent}dd` }}
        >
          +{song.diff.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
