import { SongWithScore } from "@/types/songs/withScore";
import { getMaxBpm } from "./getMaxBPM";

export interface FilterParams {
  difficulty?: string;
  level?: number;
  clearState?: string;
  bpiMin?: number;
  bpiMax?: number;
  version?: string;
  bpmMin?: number;
  bpmMax?: number;
  isSofran?: boolean;
  notesMin?: number;
  notesMax?: number;
  search?: string;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}

export const filterSongs = (
  songs: SongWithScore[],
  p: FilterParams,
): SongWithScore[] => {
  return songs.filter((s) => {
    if (p.difficulty && s.difficulty !== p.difficulty.toUpperCase())
      return false;
    if (p.level && s.difficultyLevel !== Number(p.level)) return false;
    if (p.clearState && s.clearState !== p.clearState) return false;

    if (p.bpiMin !== undefined && (s.bpi ?? -15) < Number(p.bpiMin))
      return false;
    if (p.bpiMax !== undefined && (s.bpi ?? -15) > Number(p.bpiMax))
      return false;

    if (p.version && s.releasedVersion !== Number(p.version)) return false;

    const maxBpm = getMaxBpm(s.bpm);
    if (p.bpmMin && maxBpm < Number(p.bpmMin)) return false;
    if (p.bpmMax && maxBpm > Number(p.bpmMax)) return false;
    if (p.isSofran && !s.bpm?.includes("-")) return false;

    if (p.notesMin && s.notes < Number(p.notesMin)) return false;
    if (p.notesMax && s.notes > Number(p.notesMax)) return false;

    if (p.search) {
      const target = s.title.toLowerCase();
      const word = p.search.toLowerCase();
      if (!target.includes(word)) return false;
    }
    return true;
  });
};
