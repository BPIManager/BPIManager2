export interface SongWithScore {
  songId: number;
  title: string;
  notes: number;
  bpm: string | null;
  difficulty: string; // "HYPER", "ANOTHER", "LEGGENDARIA"
  difficultyLevel: number;
  releasedVersion: number | null;

  logId: number | null;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  scoreAt: Date | string | null;

  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}

export interface FilterParams {
  difficulty?: "HYPER" | "ANOTHER" | "LEGGENDARIA";
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
  sortKey?:
    | "title"
    | "level"
    | "bpi"
    | "notes"
    | "bpm"
    | "updatedAt"
    | "version";
  sortOrder?: "asc" | "desc";
}
