import { SongWithRival, SongWithScore, RivalScore } from "@/types/songs/score";
import { AAA_RATIO, MAX_MINUS_RATIO } from "@/constants/iidx/rankBorders";
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
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

/**
 * 今作で未プレイの曲を、歴代ベスト側の行から「自分は未プレイ」の行として組み立てる。
 * 今作のスコア一覧には未プレイ曲が含まれないため、過去作でのみプレイした曲を比較に出すのに使う。
 */
export function bestEverRowToUnplayedSong(row: BestEverRow): SongWithScore {
  return {
    songId: row.songId,
    title: row.title,
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: row.difficultyLevel,
    releasedVersion: row.releasedVersion,
    notes: row.notes,
    kaidenAvg: row.kaidenAvg,
    wrScore: row.wrScore,
    coef: row.coef,
    mu: row.mu,
    sigma: row.sigma,
    residualVar: row.residualVar,
    logId: null,
    exScore: null,
    bpi: null,
    clearState: null,
    missCount: null,
    scoreAt: null,
  };
}

export function toBpiParams(s: SongWithScore): IBpiBasicSongData {
  return {
    notes: s.notes,
    kaidenAvg: s.kaidenAvg,
    wrScore: s.wrScore,
    coef: s.coef,
    // V2のBPI計算は譜面ごとのALSパラメータ(mu/sigma)が無いとnullを返す
    mu: s.mu,
    sigma: s.sigma,
    residualVar: s.residualVar,
  };
}

export function mergeFixedTarget(
  s: SongWithScore,
  targetEx: number | null,
  targetBpi: number | null,
  targetVersion?: string | null,
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
    ...(targetVersion !== undefined ? { version: targetVersion } : {}),
  };

  return { ...s, rival, exDiff, bpiDiff } as SongWithRival;
}

export const SCORE_RATE: Record<"aaa" | "max-", number> = {
  aaa: AAA_RATIO,
  "max-": MAX_MINUS_RATIO,
};
