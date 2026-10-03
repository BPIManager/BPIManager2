import { db } from "@/lib/db";

import { LatestScoreTable, LatestScoreQueryBuilder } from "@/lib/db/shared/latestScore/types";

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

/**
 * 「フォロー中ユーザー群」または「明示的な userId 配列」による `userId IN (...)` 絞り込みを
 * 適用する。{@link latestLogIdPerUserSongSubquery}/{@link latestLogIdPerUserSongScalarSubquery}
 * で同一の分岐がそれぞれ個別実装されていたため共通化した。
 *
 * @param qb - 絞り込みを適用するクエリビルダー（`userId` カラムを持つテーブルが対象）
 * @param params.userIds - 対象ユーザー ID の明示的な配列（`followersOf` と排他）
 * @param params.followersOf - このユーザーがフォローしているユーザー群を対象にする場合の viewerId
 */
export function applyUserIdsOrFollowersFilter<O>(
  qb: LatestScoreQueryBuilder<O>,
  params: { userIds?: string[]; followersOf?: string },
): LatestScoreQueryBuilder<O> {
  const { userIds, followersOf } = params;

  if (followersOf) {
    // follows行の存在だけでは判定できない(公開時代に成立したfollowsには
    // 承認記録がないため、対象が非公開の場合は承認記録の有無も要求する)
    return qb.where("userId", "in", (sub) =>
      sub
        .selectFrom("follows as f")
        .innerJoin("users as u", "u.userId", "f.followingId")
        .select("f.followingId")
        .where("f.followerId", "=", followersOf)
        .where((eb) =>
          eb.or([
            eb("u.isPublic", "=", 1),
            eb.exists(
              eb
                .selectFrom("followApprovalNotifications as fan")
                .select("fan.id")
                .where("fan.recipientId", "=", followersOf)
                .whereRef("fan.actorId", "=", "f.followingId"),
            ),
          ]),
        ),
    );
  } else if (userIds && userIds.length > 0) {
    return qb.where("userId", "in", userIds);
  }
  return qb;
}

export function baseLatestLogIdPerUserSongQuery(
  table: LatestScoreTable,
  version: string,
) {
  return db
    .selectFrom(table)
    .select(["userId", "songId", (eb) => eb.fn.max("logId").as("maxLogId")])
    .where("version", "=", version);
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
  extra?: (
    qb: ReturnType<typeof baseLatestLogIdPerUserSongQuery>,
  ) => ReturnType<typeof baseLatestLogIdPerUserSongQuery>;
}) {
  const { table, version, userIds, followersOf, songIds, extra } = params;

  let qb = applyUserIdsOrFollowersFilter(
    baseLatestLogIdPerUserSongQuery(table, version),
    { userIds, followersOf },
  );

  if (songIds && songIds.length > 0) {
    qb = qb.where("songId", "in", songIds);
  }
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy(["userId", "songId"]);
}

export function baseLatestLogIdPerUserSongScalarQuery(
  table: LatestScoreTable,
  version: string,
) {
  return db
    .selectFrom(table)
    .select((eb) => eb.fn.max("logId").as("logId"))
    .where("version", "=", version);
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
  extra?: (
    qb: ReturnType<typeof baseLatestLogIdPerUserSongScalarQuery>,
  ) => ReturnType<typeof baseLatestLogIdPerUserSongScalarQuery>;
}) {
  const { table, version, userIds, followersOf, songIds, extra } = params;

  let qb = applyUserIdsOrFollowersFilter(
    baseLatestLogIdPerUserSongScalarQuery(table, version),
    { userIds, followersOf },
  );

  if (songIds && songIds.length > 0) {
    qb = qb.where("songId", "in", songIds);
  }
  if (extra) {
    qb = extra(qb);
  }

  return qb.groupBy(["userId", "songId"]);
}
