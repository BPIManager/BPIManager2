import { db } from "@/lib/db";

import { LatestScoreTable, LatestScoreQueryBuilder } from "@/lib/db/shared/latestScore/types";

/**
 * 最新スコア取得（基準時刻を指定しない単純な最新）のクエリビルダー群。scores/allScores の両テーブルで共通化する。
 * 基準時刻付きの追い抜き判定は意味が異なるため含めない（scores/rival の getOvertakenRivals を参照）。
 */

/**
 * フォロー中ユーザー群、または明示的な userId 配列による userId IN (...) 絞り込みを適用する。両サブクエリで共通化した分岐。
 *
 * @param qb - 絞り込みを適用するクエリビルダー（userId 列を持つテーブル）
 * @param params.userIds - 対象ユーザー ID の配列（followersOf と排他）
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
 * 複数ユーザー×バージョンの「ユーザー・曲ごとの最新 logId」を集計するサブクエリ（userId, songId, maxLogId の3列）。
 * songId を1件に固定すると「1曲の全ユーザー最新スコア」（ランキング用途）としても使える。
 *
 * @param params.table - 対象テーブル（scores | allScores）
 * @param params.version - バージョン番号
 * @param params.userIds - 対象ユーザー ID の配列（followersOf と排他、両方省略時は全ユーザー）
 * @param params.followersOf - このユーザーがフォローしているユーザー群を対象にする場合の viewerId
 * @param params.songIds - 対象楽曲 ID（省略時は全曲）
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
 * WHERE logId IN (...) で使う、複数ユーザー×バージョンの「ユーザー・曲ごとの最新 logId」列（1列）のサブクエリ。
 * latestLogIdPerUserSongSubquery の IN 版。songIds を1件に固定すると1曲の全ユーザー最新として使える。
 *
 * @param params.table - 対象テーブル（scores | allScores）
 * @param params.version - バージョン番号
 * @param params.userIds - 対象ユーザー ID の配列（followersOf と排他）
 * @param params.followersOf - このユーザーがフォローしているユーザー群を対象にする場合の viewerId
 * @param params.songIds - 対象楽曲 ID（省略時は全曲）
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
