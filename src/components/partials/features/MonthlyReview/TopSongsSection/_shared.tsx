import type { TopSong, TopSongImproved } from "@/types/stats/monthlyReview";
import { useTranslation } from "@/hooks/common/useTranslation";
import { getRankDetail } from "@/constants/iidx/rankBorders";

export const styles = `
  @keyframes titleIn  { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.2em} }
  @keyframes rowIn    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes moreIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
`;

export const DIFF_COLORS: Record<string, string> = {
  HYPER: "#f59e0b",
  ANOTHER: "#ef4444",
  LEGGENDARIA: "#a855f7",
};
export const DIFF_LABELS: Record<string, string> = {
  HYPER: "H",
  ANOTHER: "A",
  LEGGENDARIA: "L",
};

export const PAGE = 5;

export function RankLabel({ rank }: { rank: number }) {
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

export function ScoreSubline({
  song,
  accent,
}: {
  song: TopSong | TopSongImproved;
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
      {song.rank > 0 && <RankLabel rank={song.rank} />}
    </div>
  );
}
