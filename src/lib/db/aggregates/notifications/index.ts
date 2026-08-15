import { db } from "@/lib/db";
import { notificationsRepo } from "@/lib/db/domains/notifications";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { NotificationOvertakenRow } from "@/types/users/notifications";
import { sql } from "kysely";

/**
 * フォロー中ユーザーに「追い抜かれた」スコアを検出する3-way self join
 * （`s2`: 追い抜いたスコア, `r`: 追い抜かれた側の直前のスコア,
 * `prevRival`: 追い抜いた側のさらに前のスコア）の共通部分を組み立てる。
 *
 * `getUnreadCount`/`getNotifications`双方が同じ検出ロジックを必要とするため
 * 共通部分を関数化している。呼び出し側は必要な`.select()`/
 * 追加の`.where()`/`.innerJoin()`を続けて使う。
 */
function overtakenScoresBaseQuery(params: {
  userId: string;
  latestVersion: string;
}) {
  const { userId, latestVersion } = params;

  // followsを起点に結合順序をstraight_joinで固定する。s2(scores)起点だと
  // フォロー中でない大多数のユーザー分まで走査する非効率な実行計画になりうるため
  // (getOvertakenRivals: commit adef304と同型の問題)。
  return db
    .selectFrom("follows as f")
    .modifyFront(sql`straight_join`)
    .innerJoin("scores as s2", (join) =>
      join
        .onRef("s2.userId", "=", "f.followingId")
        .on("s2.version", "=", latestVersion),
    )
    .innerJoin("scores as r", (join) =>
      join
        .onRef("r.songId", "=", "s2.songId")
        .on("r.version", "=", latestVersion)
        .onRef("r.userId", "=", "f.followerId")
        .on("r.logId", "=", (eb) =>
          eb
            .selectFrom("scores as r2")
            .select((s) => s.fn.max("logId").as("m"))
            .whereRef("r2.userId", "=", "r.userId")
            .whereRef("r2.songId", "=", "s2.songId")
            .whereRef("r2.lastPlayed", "<", "s2.lastPlayed"),
        ),
    )
    .leftJoin("scores as prevRival", (join) =>
      join
        .onRef("prevRival.songId", "=", "s2.songId")
        .onRef("prevRival.userId", "=", "s2.userId")
        .on("prevRival.version", "=", latestVersion)
        .on("prevRival.logId", "=", (eb) =>
          eb
            .selectFrom("scores as pr2")
            .select((s) => s.fn.max("logId").as("m"))
            .whereRef("pr2.userId", "=", "s2.userId")
            .whereRef("pr2.songId", "=", "s2.songId")
            .whereRef("pr2.lastPlayed", "<", "s2.lastPlayed"),
        ),
    )
    .where("f.followerId", "=", userId)
    .whereRef("s2.exScore", ">", "r.exScore")
    .where((eb) =>
      eb.or([
        eb("prevRival.exScore", "is", null),
        eb("r.exScore", ">", eb.ref("prevRival.exScore")),
      ]),
    );
}

/**
 * フォロー通知・追い抜き通知（`follows`/`scores`/`users`/`songs`を横断する
 * 複合ビュー）の集計・一覧取得を担当するリポジトリクラス。
 *
 * `notifications`テーブル自体の読み書きは`domains/notifications`が担う。
 */
class NotificationsAggregateRepository {
  /**
   * 未読通知数（フォロー通知 + 追い抜き通知 + 承認通知 + 保留中フォローリクエスト）を取得する。
   *
   * `notifications` テーブルの `lastReadAt` を基準に、それ以降の件数を集計する。
   * 保留中フォローリクエストは「既読/未読」ではなく対応が必要な件数のため、
   * 対応（承認/却下）されるまで常にカウントに含める。
   *
   * @param userId - ユーザー ID
   * @param latestVersion - 追い抜き通知の対象バージョン
   * @returns `{ total }` 未読件数の合計
   */
  async getUnreadCount(userId: string, latestVersion: string) {
    const lastRead = (await notificationsRepo.getLastReadAt(userId)) || new Date(0);

    const followCount = await db
      .selectFrom("follows")
      .select(sql<number>`count(*)`.as("cnt"))
      .where("followingId", "=", userId)
      .where("createdAt", ">", lastRead)
      .executeTakeFirst();

    const overtakenCount = await overtakenScoresBaseQuery({
      userId,
      latestVersion,
    })
      .select(sql<number>`count(DISTINCT s2.logId)`.as("cnt"))
      .where("s2.lastPlayed", ">", lastRead)
      .executeTakeFirst();

    const [pendingRequestCount, unreadApprovalCount] = await Promise.all([
      followRequestsRepo.countPendingForTarget(userId),
      followApprovalNotificationsRepo.countUnreadSince(userId, lastRead),
    ]);

    return {
      total:
        Number(followCount?.cnt || 0) +
        Number(overtakenCount?.cnt || 0) +
        pendingRequestCount +
        unreadApprovalCount,
    };
  }

  /**
   * フォロー通知・追い抜き通知をページネーション付きで取得する。
   *
   * `type` が `"all"` の場合は両種別を UNION ALL して返す。
   *
   * @param params.userId - ユーザー ID
   * @param params.type - 取得する通知種別（`"all"` | `"follow"` | `"overtaken"`）
   * @param params.latestVersion - 追い抜き通知の対象バージョン
   * @param params.limit - 1 ページあたりの件数
   * @param params.offset - オフセット
   * @returns `NotificationOvertakenRow` の配列（timestamp 降順）
   */
  async getNotifications(params: {
    userId: string;
    type: "all" | "follow" | "overtaken" | "followApproved";
    latestVersion: string;
    limit: number;
    offset: number;
  }) {
    const { userId, type, latestVersion, limit, offset } = params;

    const followQuery = db
      .selectFrom("follows as f")
      .innerJoin("users as u", "f.followerId", "u.userId")
      .select([
        sql<string>`'follow'`.as("type"),
        "f.createdAt as timestamp",
        "u.userName as senderName",
        "u.profileImage as senderImage",
        "u.userId as senderId",
        sql<string | null>`NULL`.as("songTitle"),
        sql<string | null>`NULL`.as("songDifficulty"),
        sql<number | null>`NULL`.as("rivalScore"),
        sql<number | null>`0`.as("myScore"),
        sql<number | null>`NULL`.as("songId"),
      ])
      .where("f.followingId", "=", userId)
      .$castTo<NotificationOvertakenRow>();

    const overtakenQuery = overtakenScoresBaseQuery({ userId, latestVersion })
      .innerJoin("users as u", "s2.userId", "u.userId")
      .innerJoin("songs as song", "s2.songId", "song.songId")
      .select([
        sql<string>`'overtaken'`.as("type"),
        "s2.lastPlayed as timestamp",
        "u.userName as senderName",
        "u.profileImage as senderImage",
        "u.userId as senderId",
        "song.title as songTitle",
        "song.difficulty as songDifficulty",
        "s2.exScore as rivalScore",
        (eb) =>
          eb
            .selectFrom("scores as sBest")
            .select(eb.fn.max("exScore").as("maxEx"))
            .whereRef("sBest.userId", "=", "f.followerId")
            .whereRef("sBest.songId", "=", "s2.songId")
            .where("sBest.version", "=", latestVersion)
            .as("myScore"),
        "s2.songId as songId",
      ])
      .$castTo<NotificationOvertakenRow>();

    const approvedQuery = db
      .selectFrom("followApprovalNotifications as e")
      .innerJoin("users as u", "e.actorId", "u.userId")
      .select([
        sql<string>`'followApproved'`.as("type"),
        "e.createdAt as timestamp",
        "u.userName as senderName",
        "u.profileImage as senderImage",
        "u.userId as senderId",
        sql<string | null>`NULL`.as("songTitle"),
        sql<string | null>`NULL`.as("songDifficulty"),
        sql<number | null>`NULL`.as("rivalScore"),
        sql<number | null>`0`.as("myScore"),
        sql<number | null>`NULL`.as("songId"),
      ])
      .where("e.recipientId", "=", userId)
      .$castTo<NotificationOvertakenRow>();

    let baseUnionQuery;
    if (type === "follow") {
      baseUnionQuery = followQuery;
    } else if (type === "overtaken") {
      baseUnionQuery = overtakenQuery;
    } else if (type === "followApproved") {
      baseUnionQuery = approvedQuery;
    } else {
      baseUnionQuery = followQuery.unionAll(overtakenQuery).unionAll(approvedQuery);
    }

    return await db
      .selectFrom(baseUnionQuery.as("notifications_sub"))
      .selectAll()
      .orderBy("timestamp", "desc")
      .limit(limit)
      .offset(offset)
      .execute();
  }
}

export const notificationsAggregateRepo = new NotificationsAggregateRepository();
