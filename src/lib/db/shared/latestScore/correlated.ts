
import { sql } from "kysely";

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
 * `eb` は呼び出し元の `.on()` コールバックが受け取るものをそのまま渡す想定だが、
 * 呼び出し元ごとにJOIN済みテーブル集合(alias含む)が異なりKyselyの型では表現しきれないため、
 * ここだけは`any`を許容する(呼び出し元での`.on()`自体は個別に型チェックされている)。
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
    // follows行の存在だけでは判定できない。
    // shared/latestScore.tsのapplyUserIdsOrFollowersFilterと同じ理由で
    // 承認記録の有無も要求する
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
