import { db } from "@/lib/db";
import { NotificationOvertakenRow } from "@/types/users/notifications";
import { sql } from "kysely";

/**
 * 通知（フォロー・追い抜き）の参照・既読管理を担当するリポジトリクラス。
 */
export class NotificationsRepository {
  /**
   * 未読通知数（フォロー通知 + 追い抜き通知）を取得する。
   *
   * `notifications` テーブルの `lastReadAt` を基準に、それ以降の件数を集計する。
   *
   * @param userId - ユーザー ID
   * @param latestVersion - 追い抜き通知の対象バージョン
   * @returns `{ total }` 未読件数の合計
   */
  async getUnreadCount(userId: string, latestVersion: string) {
    const meta = await db
      .selectFrom("notifications")
      .select("lastReadAt")
      .where("userId", "=", userId)
      .executeTakeFirst();

    const lastRead = meta?.lastReadAt || new Date(0);

    const followCount = await db
      .selectFrom("follows")
      .select(sql<number>`count(*)`.as("cnt"))
      .where("followingId", "=", userId)
      .where("createdAt", ">", lastRead)
      .executeTakeFirst();

    const overtakenCount = await db
      .selectFrom("scores as s2")
      .innerJoin("follows as f", "f.followingId", "s2.userId")
      .select(sql<number>`count(DISTINCT s2.logId)`.as("cnt"))
      .where("f.followerId", "=", userId)
      .where("s2.version", "=", latestVersion)
      .where("s2.lastPlayed", ">", lastRead)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("scores as s1")
              .select("s1.logId")
              .whereRef("s1.userId", "=", "f.followerId")
              .whereRef("s1.songId", "=", "s2.songId")
              .where("s1.version", "=", latestVersion)
              .whereRef("s1.exScore", ">=", "s2.exScore"),
          ),
        ),
      )
      .executeTakeFirst();

    return {
      total: Number(followCount?.cnt || 0) + Number(overtakenCount?.cnt || 0),
    };
  }

  /**
   * 通知の既読日時を現在時刻で更新する（UPSERT）。
   *
   * @param userId - ユーザー ID
   */
  async updateLastRead(userId: string) {
    await db
      .insertInto("notifications")
      .values({
        userId,
        lastReadAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        lastReadAt: new Date(),
      })
      .execute();
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
    type: "all" | "follow" | "overtaken";
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

    const overtakenQuery = db
      .selectFrom("scores as s2")
      .innerJoin("follows as f", "f.followingId", "s2.userId")
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
      .where("f.followerId", "=", userId)
      .where("s2.version", "=", latestVersion)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom("scores as s1")
              .select("s1.logId")
              .whereRef("s1.userId", "=", "f.followerId")
              .whereRef("s1.songId", "=", "s2.songId")
              .where("s1.version", "=", latestVersion)
              .whereRef("s1.exScore", ">=", "s2.exScore"),
          ),
        ),
      )
      .$castTo<NotificationOvertakenRow>();

    let baseUnionQuery;
    if (type === "follow") {
      baseUnionQuery = followQuery;
    } else if (type === "overtaken") {
      baseUnionQuery = overtakenQuery;
    } else {
      baseUnionQuery = followQuery.unionAll(overtakenQuery);
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

export const notificationsRepo = new NotificationsRepository();
