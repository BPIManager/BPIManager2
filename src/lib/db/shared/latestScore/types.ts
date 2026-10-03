
import { type SelectQueryBuilder } from "kysely";
import type { Database } from "@/types/db";

/**
 * 最新スコア取得（基準時刻を指定しない単純な最新）のパターンで使う型。scores/allScores で共通化する。
 * 基準時刻付きの追い抜き判定は意味が異なるため含めない（scores/rival の getOvertakenRivals を参照）。
 */

export type LatestScoreTable = "scores" | "allScores";

export type LatestScoreQueryBuilder<O> = SelectQueryBuilder<
  Database,
  LatestScoreTable,
  O
>;
