import { SongWithRival, SongWithScore, RivalScore } from "@/types/songs/score";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

/**
 * `useAnalyticsComparison`が扱う各比較ターゲット種別のAPIレスポンス行の型と、
 * 自スコア(`SongWithScore`)へ比較対象の値をマージする共通ヘルパー。
 */

export interface ArenaAverageRow {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  averages: Record<
    string,
    { avgExScore: number; rate: number; count: number; avgBpi?: number }
  >;
}

export interface RivalCommonRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
}

export interface RivalAvgRow extends RivalCommonRow {
  avgExScore: number | null;
  avgBpi: number | null;
}

export interface RivalTopRow extends RivalCommonRow {
  topExScore: number | null;
  topBpi: number | null;
}

export interface BestEverRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string | null;
  releasedVersion: number | null;
  bestExScore: number | null;
  bestBpi: number | null;
  bestVersion: string | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}

export function toBpiParams(s: SongWithScore): IBpiBasicSongData {
  return {
    notes: s.notes,
    kaidenAvg: s.kaidenAvg,
    wrScore: s.wrScore,
    coef: s.coef,
  };
}

export function mergeFixedTarget(
  s: SongWithScore,
  targetEx: number | null,
  targetBpi: number | null,
): SongWithRival {
  const exDiff =
    s.exScore !== null && targetEx !== null ? s.exScore - targetEx : undefined;
  const bpiDiff =
    s.bpi !== null && targetBpi !== null
      ? Math.round((Number(s.bpi) - targetBpi) * 100) / 100
      : undefined;

  const rival: RivalScore = {
    exScore: targetEx,
    bpi: targetBpi,
    clearState: null,
    missCount: null,
    lastPlayed: null,
  };

  return { ...s, rival, exDiff, bpiDiff } as SongWithRival;
}

export const SCORE_RATE: Record<"aaa" | "max-", number> = {
  aaa: 8 / 9,
  "max-": 17 / 18,
};
