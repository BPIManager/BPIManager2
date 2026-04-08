import Link from "next/link";
import { RadarSectionChart } from "@/components/partials/DashBoard/Radar/index";
import { DifficultyBadge } from "./DifficultyBadge";
import { buildRadarData } from "@/utils/songs/songListFilter";
import { SONG_ATTRIBUTES } from "@/constants/songAttributes";
import type { SongListItem } from "@/types/songs/songInfo";
import type { SortKey } from "@/types/songs/songList";

interface SongRowProps {
  song: SongListItem;
  sortKey: SortKey;
}

export function SongRow({ song, sortKey }: SongRowProps) {
  const hasAttributes =
    song.g_scratch !== null ||
    song.g_soflan !== null ||
    song.g_cn !== null ||
    song.g_chord !== null ||
    song.g_intensity !== null ||
    song.g_udeoshi !== null;

  const attrDef = SONG_ATTRIBUTES.find((a) => a.sortKey === sortKey);
  const attrValue =
    attrDef !== undefined
      ? (song[attrDef.dbKey.replace("p_", "g_") as keyof SongListItem] as
          | number
          | null)
      : null;

  return (
    <Link
      href={`/songs/${song.songId}/notes`}
      className="flex h-full items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface px-4 py-3 hover:bg-bpim-overlay/60 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-bpim-text truncate">
          {song.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DifficultyBadge
            difficulty={song.difficulty}
            level={song.difficultyLevel}
          />
          <span className="text-xs text-bpim-muted font-mono">
            {song.notes} NOTES
          </span>
          <span className="text-xs text-bpim-muted font-mono">
            {song.bpm} BPM
          </span>
          {attrDef !== undefined && attrValue !== null && (
            <span className="rounded bg-bpim-primary/20 px-1.5 py-0.5 text-[10px] font-bold font-mono text-bpim-primary">
              {attrDef.label} {Math.round(attrValue)}
            </span>
          )}
        </div>
      </div>

      <div className="w-[120px] shrink-0">
        {hasAttributes ? (
          <RadarSectionChart
            data={{}}
            rivalData={buildRadarData(song, "global")}
            rivalOnly
            isMini
            songAttr
          />
        ) : (
          <div className="flex h-[100px] items-center justify-center text-[10px] text-bpim-muted">
            データなし
          </div>
        )}
      </div>
    </Link>
  );
}
