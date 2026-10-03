
import { sql } from "kysely";

import { LatestScoreTable } from "@/lib/db/shared/latestScore/types";


/**
 * 最新スコア取得（基準時刻を指定しない単純な最新）のクエリビルダー群。scores/allScores の両テーブルで共通化する。
 * 基準時刻付きの追い抜き判定は意味が異なるため意図的にここには含めない（scores/rival の getOvertakenRivals を参照）。
 */

/**
 * JOIN ON 句に埋め込む相関サブクエリ版の最新 logId 取得式。複数の最新スコアを同一クエリ内で並列に JOIN する場合に使う。
 * eb は呼び出し元の on コールバックの型をそのまま受け取るが、JOIN集合の型を表現できないため一部 any を許容する。
 *
 * @param eb - 呼び出し元の `.on()` コールバックが受け取る ExpressionBuilder
 * @param params.table - 対象テーブル（scores | allScores）
 * @param params.alias - サブクエリ内のテーブル別名（クエリ内で一意）
 * @param params.songIdRef - 相関先の外側 songId 参照（例: s.songId）
 * @param params.version - バージョン番号
 * @param params.userId - 対象ユーザーを固定1人に絞る場合
 * @param params.followersOf - 対象を viewer のフォロー中一覧に絞る場合の viewerId
 * @param params.userIdRef - 外側テーブルの userId 列に相関させる場合（userId/followersOf と排他）
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
    // follows 行の存在だけでは判定しない。applyUserIdsOrFollowersFilter と同じく承認記録の有無も要求する。
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sub = sub.where(sql.ref(`${alias}.userId`), "in", (qb: any) =>
      qb
        .selectFrom("follows as f")
        .innerJoin("users as u", "u.userId", "f.followingId")
        .select("f.followingId")
        .where("f.followerId", "=", followersOf)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .where((eb: any) =>
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
  } else if (userIdRef) {
    sub = sub.whereRef(sql.ref(`${alias}.userId`), "=", userIdRef);
  }

  return sub;
}
