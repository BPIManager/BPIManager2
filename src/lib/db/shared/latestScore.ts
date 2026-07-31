import { db } from "@/lib/db";
import { sql } from "kysely";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: (qb: any) => any;
}) {
  const { table, userId, version, extra } = params;

  let qb = db
    .selectFrom(table as "scores" | "allScores")
    .select(["songId", (eb) => eb.fn.max("logId").as("maxLogId")])
    .where("userId", "=", userId);

  if (version !== undefined) {
    qb = qb.where("version", "=", version);
  }
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy("songId");
}

/**
 * 複数ユーザー（フォロー中ユーザー群、または明示的な userId 配列）×バージョンの
 * 「ユーザー・曲ごとの最新 logId」を集計するサブクエリを組み立てる。
 *
 * 返り値は `userId, songId, maxLogId` の3列を持つ。呼び出し側は
 * `s.logId = latest.maxLogId AND s.userId = latest.userId AND s.songId = latest.songId`
 * で結合する。
 *
 * `songId` を固定1件のみ指定した場合、実質的に「1曲についての全ユーザー最新スコア」
 * （ランキング系クエリ）としても使える。
 *
 * @param params.table - 対象テーブル（`scores` | `allScores`）
 * @param params.version - バージョン番号
 * @param params.userIds - 対象ユーザー ID の明示的な配列（`followersOf` と排他、両方省略時は全ユーザー対象）
 * @param params.followersOf - このユーザーがフォローしているユーザー群を対象にする場合の viewerId
 * @param params.songIds - 対象楽曲 ID を絞り込む場合（省略時は全曲対象）
 * @param params.extra - 追加の絞り込みを差し込むコールバック
 */
export function latestLogIdPerUserSongSubquery(params: {
  table: LatestScoreTable;
  version: string;
  userIds?: string[];
  followersOf?: string;
  songIds?: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: (qb: any) => any;
}) {
  const { table, version, userIds, followersOf, songIds, extra } = params;

  let qb = db
    .selectFrom(table as "scores" | "allScores")
    .select(["userId", "songId", (eb) => eb.fn.max("logId").as("maxLogId")])
    .where("version", "=", version);

  if (followersOf) {
    qb = qb.where("userId", "in", (sub) =>
      sub
        .selectFrom("follows")
        .select("followingId")
        .where("followerId", "=", followersOf),
    );
  } else if (userIds && userIds.length > 0) {
    qb = qb.where("userId", "in", userIds);
  }

  if (songIds && songIds.length > 0) {
    qb = qb.where("songId", "in", songIds);
  }
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy(["userId", "songId"]);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: (qb: any) => any;
}) {
  const { table, userId, version, extra } = params;

  let qb = db
    .selectFrom(table as "scores" | "allScores")
    .select((eb) => eb.fn.max("logId").as("logId"))
    .where("userId", "=", userId)
    .where("version", "=", version);

  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy("songId");
}

/**
 * `WHERE <table>.logId IN (...)` の形で使うための、複数ユーザー（フォロー中ユーザー群、
 * または明示的な userId 配列）×バージョンの「ユーザー・曲ごとの最新 logId」列（1列のみ）を
 * 返すサブクエリを組み立てる。
 *
 * {@link latestLogIdPerUserSongSubquery} の `IN` サブクエリ版。`songIds` を固定1件のみ
 * 指定した場合、「1曲についての全ユーザー最新スコア」（`userId` のみでグルーピングするのと等価）
 * としても使える。
 *
 * @param params.table - 対象テーブル（`scores` | `allScores`）
 * @param params.version - バージョン番号
 * @param params.userIds - 対象ユーザー ID の明示的な配列（`followersOf` と排他）
 * @param params.followersOf - このユーザーがフォローしているユーザー群を対象にする場合の viewerId
 * @param params.songIds - 対象楽曲 ID を絞り込む場合（省略時は全曲対象）
 * @param params.extra - 追加の絞り込みを差し込むコールバック
 */
export function latestLogIdPerUserSongScalarSubquery(params: {
  table: LatestScoreTable;
  version: string;
  userIds?: string[];
  followersOf?: string;
  songIds?: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: (qb: any) => any;
}) {
  const { table, version, userIds, followersOf, songIds, extra } = params;

  let qb = db
    .selectFrom(table as "scores" | "allScores")
    .select((eb) => eb.fn.max("logId").as("logId"))
    .where("version", "=", version);

  if (followersOf) {
    qb = qb.where("userId", "in", (sub) =>
      sub
        .selectFrom("follows")
        .select("followingId")
        .where("followerId", "=", followersOf),
    );
  } else if (userIds && userIds.length > 0) {
    qb = qb.where("userId", "in", userIds);
  }

  if (songIds && songIds.length > 0) {
    qb = qb.where("songId", "in", songIds);
  }
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy(["userId", "songId"]);
}

/**
 * `JOIN ... ON` 句の中に直接埋め込む「相関サブクエリ版」の最新 logId 取得式を組み立てる。
 *
 * `leftJoin`/`innerJoin` の `.on("<alias>.logId", "=", (eb) => correlatedLatestLogId(eb, {...}))`
 * のように使う。外側テーブルの `songId` に相関し、`version`・`userId`(固定 or フォロー中一覧)
 * で絞り込んだ「曲ごとの最新 logId」を1件返す。
 *
 * 前述の {@link latestLogIdPerSongSubquery}/{@link latestLogIdPerUserSongSubquery} は
 * 独立したサブクエリとして `innerJoin`/`leftJoin` するのに対し、こちらは
 * 複数の相関サブクエリを1クエリ内で並列に JOIN する（自分のスコアとライバルのスコアを
 * 同時に左結合する、等）ケース向け。
 *
 * @param eb - 呼び出し元の `.on()` コールバックが受け取る `ExpressionBuilder`
 * @param params.table - 対象テーブル（`scores` | `allScores`）
 * @param params.alias - サブクエリ内で使うテーブル別名（クエリ内で一意にすること）
 * @param params.songIdRef - 相関先となる外側テーブルの songId 参照（例: `"s.songId"`）
 * @param params.version - バージョン番号
 * @param params.userId - 対象ユーザー ID を固定1人に絞る場合
 * @param params.followersOf - 対象ユーザーを「このユーザーのフォロー中一覧」に絞る場合の viewerId
 * @param params.userIdRef - 対象ユーザー ID を外側テーブルの別カラム参照に相関させる場合
 *   （例: 外側で既に `r.userId in (...)` 等で絞り込み済みの行に対し、同じ `r.userId` に一致する
 *   最新ログを取る）。`userId`/`followersOf` と排他。
 */
export function correlatedLatestLogId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eb: any,
  params: {
    table: LatestScoreTable;
    alias: string;
    songIdRef: string;
    version: string;
    userId?: string;
    followersOf?: string;
    userIdRef?: string;
  },
) {
  const { table, alias, songIdRef, version, userId, followersOf, userIdRef } =
    params;

  let sub = eb
    .selectFrom(`${table} as ${alias}`)
    .select(
      (s: {
        fn: { max: (col: string) => { as: (name: string) => unknown } };
      }) => s.fn.max(sql.ref(`${alias}.logId`) as unknown as string).as("m"),
    )
    .where(sql.ref(`${alias}.version`), "=", version)
    .whereRef(sql.ref(`${alias}.songId`), "=", songIdRef);

  if (userId) {
    sub = sub.where(sql.ref(`${alias}.userId`), "=", userId);
  } else if (followersOf) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sub = sub.where(sql.ref(`${alias}.userId`), "in", (qb: any) =>
      qb
        .selectFrom("follows")
        .select("followingId")
        .where("followerId", "=", followersOf),
    );
  } else if (userIdRef) {
    sub = sub.whereRef(sql.ref(`${alias}.userId`), "=", userIdRef);
  }

  return sub;
}
