
import { type SelectQueryBuilder } from "kysely";
import type { Database } from "@/types/db";

/**
 * 「最新スコア取得」パターンの共通クエリビルダー群。
 *
 * `scores`/`allScores` の両テーブルで繰り返し実装されていた
 * 「ユーザー(群)×バージョンごとの曲別最新スコア」を求めるサブクエリを集約する。
 *
 * ここに集約するのはあくまで「基準時刻を指定しない、単純な最新スコア」パターンのみ。
 * 「ある基準時刻より前の最新スコア」(追い抜き判定などの時刻境界付き相関サブクエリ)は
 * 意味的に別物のため、意図的にここには含めない
 * ({@link "@/lib/db/domains/scores/rival"}の`getOvertakenRivals`、
 * {@link "@/lib/db/domains/notifications"}の追い抜き通知検出ロジックを参照)。
 */

export type LatestScoreTable = "scores" | "allScores";

export type LatestScoreQueryBuilder<O> = SelectQueryBuilder<
  Database,
  LatestScoreTable,
  O
>;
