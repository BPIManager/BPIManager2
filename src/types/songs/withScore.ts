export interface SongWithScore {
  songId: number;
  title: string;
  notes: number;
  bpm: string | null;
  difficulty: string;
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

  // ログビューア経由で表示したときだけ以下が必要
  exDiff?: number;
  bpiDiff?: number;
  djRankDisplay?: {
    current: string;
    next: string;
  };
  isRankUp?: boolean;
}

export interface FilterParamsFrontend {
  difficulties?: Difficulties[];
  levels?: number[];
  clearStates?: string[];
  versions?: number[];

  bpiMin?: number;
  bpiMax?: number;
  bpmMin?: number;
  bpmMax?: number;
  isSofran?: boolean;
  notesMin?: number;
  notesMax?: number;

  isMyPlayed?: boolean;
  isRivalPlayed?: boolean;

  search?: string;
  since?:
    | "today"
    | "yesterday"
    | "thisWeek"
    | "thisMonth"
    | "past7"
    | "past30"
    | string;
  until?: string | undefined;
  sortKey?:
    | "title"
    | "level"
    | "bpi"
    | "notes"
    | "bpm"
    | "updatedAt"
    | "version"
    | "rivalBpi"
    | "myBpi"
    | "rivalRate"
    | "myRate"
    | "winGapAsc"
    | "winGapDesc"
    | "loseGapAsc"
    | "loseGapDesc"
    | "winBpiGapAsc"
    | "winBpiGapDesc"
    | "loseBpiGapAsc"
    | "loseBpiGapDesc"
    | "rivalUpdated"
    | "myUpdated";
  sortOrder?: "asc" | "desc";
}

export type Difficulties = "HYPER" | "ANOTHER" | "LEGGENDARIA";
