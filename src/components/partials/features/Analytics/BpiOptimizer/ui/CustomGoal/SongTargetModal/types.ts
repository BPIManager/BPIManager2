


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
