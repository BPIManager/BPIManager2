import { SONG_ATTRIBUTES, SONG_ATTRIBUTES_GLOBAL } from "@/constants/songAttributes";
import type { SongListItem, SimilarSongItem } from "@/types/songs/songInfo";
import type { SortKey, SortDir, AttrMode } from "@/types/songs/songList";

export const LEVEL_OPTIONS = ["11", "12"] as const;
export const DIFFICULTY_OPTIONS = ["HYPER", "ANOTHER", "LEGGENDARIA"] as const;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "title", label: "曲名" },
  { value: "notes", label: "ノート数" },
  { value: "bpm", label: "BPM" },
  ...SONG_ATTRIBUTES.map((a) => ({ value: a.sortKey as SortKey, label: a.sortLabel })),
];

export function getBpmNum(bpm: string): number {
  const parts = bpm.split("-").map(Number).filter(Boolean);
  return parts.length > 0 ? Math.max(...parts) : 0;
}

export function getSortValue(
  song: SongListItem,
  key: SortKey,
  mode: AttrMode = "profile",
): string | number {
  switch (key) {
    case "title":
      return song.title;
    case "notes":
      return song.notes;
    case "bpm":
      return getBpmNum(song.bpm);
    default: {
      const attr = SONG_ATTRIBUTES.find((a) => a.sortKey === key);
      if (attr) {
        const dbKey =
          mode === "global" ? attr.dbKey.replace("p_", "g_") : attr.dbKey;
        return (song[dbKey as keyof SongListItem] as number | null) ?? -1;
      }
      return -1;
    }
  }
}

export type RadarSource = SongListItem | SimilarSongItem;

export function buildRadarData(
  song: RadarSource,
  mode: AttrMode = "profile",
): Record<string, number> {
  const attrs = mode === "global" ? SONG_ATTRIBUTES_GLOBAL : SONG_ATTRIBUTES;
  return Object.fromEntries(
    attrs.map(({ dbKey, label }) => [
      label,
      (song[dbKey as keyof RadarSource] as number | null) ?? 0,
    ]),
  );
}

export function filterAndSortSongs(
  songs: SongListItem[],
  search: string,
  levels: Set<string>,
  difficulties: Set<string>,
  sortKey: SortKey,
  sortDir: SortDir,
  mode: AttrMode = "profile",
): SongListItem[] {
  let result = songs;

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((s) => s.title.toLowerCase().includes(q));
  }
  if (levels.size > 0) {
    result = result.filter((s) => levels.has(String(s.difficultyLevel)));
  }
  if (difficulties.size > 0) {
    result = result.filter((s) => difficulties.has(s.difficulty));
  }

  return [...result].sort((a, b) => {
    const av = getSortValue(a, sortKey, mode);
    const bv = getSortValue(b, sortKey, mode);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });
}
