import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { List, type RowComponentProps } from "react-window";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SongListSkeleton } from "./skeleton";
import { RadarSectionChart } from "@/components/partials/DashBoard/Radar/index";
import { DifficultyBadge } from "@/components/partials/Songs/DifficultyBadge";
import { SONG_ATTRIBUTES } from "@/constants/songAttributes";
import { DIFFICULTY_OPTIONS, SORT_OPTIONS, buildRadarData } from "@/utils/songs/songListFilter";
import type { SongListItem } from "@/types/songs/songInfo";
import type { SortDir, SortKey } from "@/types/songs/songList";

// ---- SortIcon ---------------------------------------------------------------

interface SortIconProps {
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
}

export function SortIcon({ sortKey, currentKey, dir }: SortIconProps) {
  if (sortKey !== currentKey)
    return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 text-bpim-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-bpim-primary" />
  );
}

// ---- SongFilterControls -----------------------------------------------------

interface SongFilterControlsProps {
  localSearch: string;
  onSearchChange: (v: string) => void;
  difficulties: Set<string>;
  onToggleDifficulty: (diff: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortClick: (key: SortKey) => void;
}

export function SongFilterControls({
  localSearch,
  onSearchChange,
  difficulties,
  onToggleDifficulty,
  sortKey,
  sortDir,
  onSortClick,
}: SongFilterControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface p-4">
      <Input
        placeholder="楽曲名で検索..."
        value={localSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 border-bpim-border bg-bpim-bg text-bpim-text text-xs placeholder:text-bpim-muted"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase w-20 shrink-0">
          Difficulty
        </span>
        <div className="flex h-8 items-center flex-wrap gap-x-4 gap-y-2">
          {DIFFICULTY_OPTIONS.map((diff) => (
            <div key={diff} className="flex items-center gap-2">
              <Checkbox
                id={`diff-${diff}`}
                checked={difficulties.has(diff)}
                onCheckedChange={() => onToggleDifficulty(diff)}
                className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
              />
              <Label
                htmlFor={`diff-${diff}`}
                className="cursor-pointer text-xs font-bold leading-none text-bpim-text"
              >
                {diff.slice(0, 1)}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase w-20 shrink-0">
          Sort
        </span>
        <div className="flex flex-wrap gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortClick(opt.value)}
              className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                sortKey === opt.value
                  ? "bg-bpim-primary/20 text-bpim-primary border-bpim-primary/40"
                  : "bg-bpim-overlay text-bpim-muted border-bpim-border hover:border-bpim-primary/30"
              }`}
            >
              {opt.label}
              <SortIcon sortKey={opt.value} currentKey={sortKey} dir={sortDir} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- SongRow ----------------------------------------------------------------

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
        <p className="text-sm font-bold text-bpim-text truncate">{song.title}</p>
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

// ---- SongVirtualList --------------------------------------------------------

export const SONG_ROW_HEIGHT = 132;

interface VirtualRowProps {
  songs: SongListItem[];
  sortKey: SortKey;
}

function VirtualRow({ index, style, songs, sortKey }: RowComponentProps<VirtualRowProps>) {
  const song = songs[index];
  return (
    <div style={{ ...style, paddingBottom: 8 }}>
      <SongRow song={song} sortKey={sortKey} />
    </div>
  );
}

function useListHeight(offset = 420): number {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const update = () => setHeight(Math.max(400, window.innerHeight - offset));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [offset]);

  return height;
}

interface SongVirtualListProps {
  songs: SongListItem[];
  isLoading: boolean;
  sortKey: SortKey;
}

export function SongVirtualList({ songs, isLoading, sortKey }: SongVirtualListProps) {
  const listHeight = useListHeight();

  if (isLoading) {
    return <SongListSkeleton />;
  }

  if (songs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-bpim-muted">
        条件に一致する楽曲が見つかりませんでした
      </p>
    );
  }

  return (
    <List
      style={{ height: listHeight }}
      rowComponent={VirtualRow}
      rowCount={songs.length}
      rowHeight={SONG_ROW_HEIGHT}
      rowProps={{ songs, sortKey }}
    />
  );
}
