import { db } from "@/lib/db";

import { LatestScoreTable } from "@/lib/db/shared/latestScore/types";

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

export function baseLatestLogIdPerSongQuery(
  table: LatestScoreTable,
  userId: string,
  version?: string,
) {
  let qb = db
    .selectFrom(table)
    .select(["songId", (eb) => eb.fn.max("logId").as("maxLogId")])
    .where("userId", "=", userId);

  if (version !== undefined) {
    qb = qb.where("version", "=", version);
  }

  return qb;
}

/**
 * 指定した1ユーザー×バージョンの「曲ごとの最新 logId」を集計するサブクエリを組み立てる。
 *
 * 返り値は `songId, maxLogId` の2列を持つ。`logId` はテーブル内で一意なため、
 * 呼び出し側は通常 `latest.maxLogId = <table>.logId` のみで結合できる
 * （ドライバーテーブルが曲マスタ側の場合は `songId` でも結合する）。
 *
 * @param params.table - 対象テーブル（`scores` | `allScores`）
 * @param params.userId - 対象ユーザー ID（固定1人）
 * @param params.version - バージョン番号（省略時はバージョン絞り込みなし。例: `allScoresRepo.getAllScoresList`）
 * @param params.extra - 追加の絞り込み（例: `lastPlayed < X` 等）を差し込むコールバック
 */
export function latestLogIdPerSongSubquery(params: {
  table: LatestScoreTable;
  userId: string;
  version?: string;
  extra?: (
    qb: ReturnType<typeof baseLatestLogIdPerSongQuery>,
  ) => ReturnType<typeof baseLatestLogIdPerSongQuery>;
}) {
  const { table, userId, version, extra } = params;

  let qb = baseLatestLogIdPerSongQuery(table, userId, version);
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy("songId");
}

export function baseLatestLogIdPerSongScalarQuery(
  table: LatestScoreTable,
  userId: string,
  version: string,
) {
  return db
    .selectFrom(table)
    .select((eb) => eb.fn.max("logId").as("logId"))
    .where("userId", "=", userId)
    .where("version", "=", version);
}

/**
 * `WHERE <table>.logId IN (...)` の形で使うための、単一ユーザー×バージョンの
 * 「曲ごとの最新 logId」列（1列のみ）を返すサブクエリを組み立てる。
 *
 * {@link latestLogIdPerSongSubquery} は `songId, maxLogId` の2列を返し `JOIN` 用途を想定するが、
 * `IN` サブクエリはスカラー(1列)である必要があるため、こちらは `maxLogId` 列のみを返す。
 * 集計内容（対象ユーザー・バージョン・グルーピング）は同一。
 *
 * @param params.table - 対象テーブル（`scores` | `allScores`）
 * @param params.userId - 対象ユーザー ID（固定1人）
 * @param params.version - バージョン番号
 * @param params.extra - 追加の絞り込みを差し込むコールバック
 */
export function latestLogIdPerSongScalarSubquery(params: {
  table: LatestScoreTable;
  userId: string;
  version: string;
  extra?: (
    qb: ReturnType<typeof baseLatestLogIdPerSongScalarQuery>,
  ) => ReturnType<typeof baseLatestLogIdPerSongScalarQuery>;
}) {
  const { table, userId, version, extra } = params;

  let qb = baseLatestLogIdPerSongScalarQuery(table, userId, version);
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy("songId");
}
