import type { BpmBand } from "@/hooks/songs/useSongSearch";
import type { SongSearchResult } from "@/hooks/songs/useSongSearch";



export type SearchMode = "title" | "radar" | "bpm";

export const SEARCH_MODES: SearchMode[] = ["title", "radar", "bpm"];

export const BPM_BANDS: BpmBand[] = ["slow", "mid", "fast", "soflan"];

export type SongSortOrder = "title" | "bpiDesc" | "bpiAsc";

export const SONG_SORT_ORDERS: SongSortOrder[] = ["title", "bpiDesc", "bpiAsc"];

export interface CustomGoalTargetInput {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  toExScore: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

/** 曲一覧の1行（並び替え後の表示用）。 */
export type SongRow = {
  song: SongSearchResult;
  currentEx: number | null;
  currentBpi: number | null;
};
