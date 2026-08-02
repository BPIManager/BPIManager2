import type { RivalSongHighlight } from "@/types/stats/monthlyReview";
import { DIFF_COLORS, DIFF_LABELS } from "./constants";

export const SongRow = ({
  song,
  delay,
}: {
  song: RivalSongHighlight;
  delay: number;
}) => (
  <div
    className="flex items-center gap-2"
    style={{ animation: `songIn 0.4s ease-out ${delay}s both` }}
  >
    <span
      className="shrink-0 rounded px-1 py-0.5 text-[9px] font-black"
      style={{
        background: `${DIFF_COLORS[song.difficulty] ?? "#94a3b8"}22`,
        color: DIFF_COLORS[song.difficulty] ?? "#94a3b8",
      }}
    >
      {DIFF_LABELS[song.difficulty] ?? song.difficulty}
    </span>
    <span
      className="flex-1 truncate text-xs"
      style={{ color: "rgba(255,255,255,0.6)" }}
    >
      {song.title}
    </span>
    <span
      className="shrink-0 font-mono text-[10px] tabular-nums"
      style={{ color: "rgba(255,255,255,0.5)" }}
    >
      {song.userExScore}
    </span>
    <span
      className="shrink-0 text-[9px]"
      style={{ color: "rgba(255,255,255,0.2)" }}
    >
      vs
    </span>
    <span
      className="shrink-0 font-mono text-[10px] tabular-nums"
      style={{ color: "rgba(255,255,255,0.35)" }}
    >
      {song.rivalExScore}
    </span>
    <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-400">
      +{song.margin}
    </span>
  </div>
);
