import { IidxDifficulty } from "../iidx/difficulty";
import { Score } from "@/types/db";

export interface RivalScore {
  userId?: string | null;
  userName?: string | null;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  lastPlayed: Date | string | null;
}

export interface SongWithScore {
  // 楽曲基本情報
  songId: number;
  title: string;
  notes: number;
  bpm: string | null;
  difficulty: string;
  difficultyLevel: number;
  releasedVersion: number | null;

  // 自分のスコア詳細
  logId: number | null;
  exScore: number | null;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
  scoreAt: Date | string | null;

  // 楽曲定義（BPI計算用）
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;

  rival?: RivalScore | null;

  exDiff?: number;
  bpiDiff?: number;
  lastPlayedMax?: Date | string | null;

  djRankDisplay?: {
    current: string;
    next: string;
  };
  isRankUp?: boolean;
}

export interface SongWithRival extends SongWithScore {
  rival: RivalScore;
}

export type SongForSort = SongWithScore;

export interface FilterParamsFrontend {
  difficulties?: IidxDifficulty[];
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
    | "exScore"
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
    | "myUpdated"
    | "scoreRate";
  sortOrder?: "asc" | "desc";
  compareVersion?: string;
}

export type SongHistoryResponse = {
  [version: string]: Score[];
};
