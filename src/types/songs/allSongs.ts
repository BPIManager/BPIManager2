export type AllDifficulties =
  | "BEGINNER"
  | "NORMAL"
  | "HYPER"
  | "ANOTHER"
  | "LEGGENDARIA";

export interface AllSongWithScore {
  songId: number;
  title: string;
  notes: number;
  bpm: string | null;
  difficulty: AllDifficulties;
  difficultyLevel: number;
  releasedVersion: number | null;

  logId: number | null;
  exScore: number | null;
  clearState: string | null;
  missCount: number | null;
  lastPlayed: Date | string | null;
}

export interface AllScoreFilterParams {
  search?: string;
  levels?: number[];
  difficulties?: AllDifficulties[];
  clearStates?: string[];
  sortKey?: "title" | "level" | "exScore" | "updatedAt" | "clearState";
  sortOrder?: "asc" | "desc";
}
