import { db } from "@/lib/db";

import { LatestScoreTable } from "@/lib/db/shared/latestScore/types";

/**
 * 最新スコア取得（基準時刻を指定しない単純な最新）のクエリビルダー群。scores/allScores の両テーブルで共通化する。
 * 基準時刻付きの追い抜き判定は意味が異なるため意図的にここには含めない（scores/rival の getOvertakenRivals を参照）。
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
 * 1ユーザー×バージョンの「曲ごとの最新 logId」を集計するサブクエリ（songId・maxLogId の2列）。
 * logId はテーブル内で一意なため、通常は maxLogId のみで結合できる。
 *
 * @param params.table - 対象テーブル（scores | allScores）
 * @param params.userId - 対象ユーザー ID（固定1人）
 * @param params.version - バージョン番号（省略時はバージョン絞り込みなし）
 * @param params.extra - 追加の絞り込みを差し込むコールバック
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
 * WHERE logId IN (...) で使う、単一ユーザー×バージョンの「曲ごとの最新 logId」（1列）のサブクエリ。
 * latestLogIdPerSongSubquery の IN 版で、集計内容は同一。
 *
 * @param params.table - 対象テーブル（scores | allScores）
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
