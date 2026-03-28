import { OvertakenRivalInfo } from "./overtaken";

export interface BatchRef {
  batchId: string;
  createdAt: string;
  totalBpi?: number;
}

export interface BatchDetailItem {
  songId: number;
  title: string;
  notes: number;
  difficulty: string;
  difficultyLevel: number;
  level: number;
  bpm?: string | null;
  releasedVersion?: number | null;
  wrScore?: number | null;
  kaidenAvg?: number | null;
  coef?: number | null;
  current: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    missCount: number | null;
    lastPlayedAt: string;
  };
  previous: {
    exScore: number;
    bpi: number;
    clearState: string | null;
    missCount: number | null;
  } | null;
  diff: {
    exScore: number;
    bpi: number;
    isRankUp?: boolean;
  };
  overtaken: OvertakenRivalInfo[];
}

export interface BatchDetailResponse {
  songs: BatchDetailItem[];
  pagination: {
    prev: BatchRef | null;
    next: BatchRef | null;
    current: BatchRef;
    dailyBatchIds: string[];
    dailyBatchCount: number;
  };
}

export interface LogsDetailResponse extends BatchDetailResponse {
  pagination: BatchDetailResponse["pagination"] & {
    prevDate: string | null;
    nextDate: string | null;
  };
}
