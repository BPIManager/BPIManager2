import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォローリクエスト承認通知（`followApprovalNotifications` テーブル）の
 * 読み書きを担当するリポジトリクラス。
 *
 * 却下・強制解除は相手に通知しない（角が立つため）。承認のみ通知する。
 * `follow`/`overtaken`通知(`aggregates/notifications`)は`lastReadAt`基準の
 * 動的生成のみで完結するが、こちらは1件ごとに既読/未読を個別に持つ必要が
 * あるため別テーブルで管理する。
 */
class FollowApprovalNotificationsRepository {
  /**
   * 承認通知を記録する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param params.recipientId - 通知の受信者（リクエスト送信者）
   * @param params.actorId - 承認したユーザー
   */
  async create(
    trx: Transaction<Database>,
    params: { recipientId: string; actorId: string },
  ) {
    await trx.insertInto("followApprovalNotifications").values(params).execute();
  }

  /**
   * 指定ユーザー宛の未読件数を取得する。
   *
   * @param recipientId - 通知の受信者
   */
  async countUnread(recipientId: string): Promise<number> {
    const result = await db
      .selectFrom("followApprovalNotifications")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("recipientId", "=", recipientId)
      .where("isRead", "=", 0)
      .executeTakeFirst();

    return Number(result?.cnt ?? 0);
  }

  /**
   * 指定ユーザー宛の承認通知をページネーション付きで取得する。
   *
   * @param recipientId - 通知の受信者
   * @param limit - 取得件数
   * @param offset - オフセット
   */
  async listForRecipient(recipientId: string, limit: number, offset: number) {
    return await db
      .selectFrom("followApprovalNotifications as e")
      .innerJoin("users as u", "u.userId", "e.actorId")
      .select([
        "e.id",
        "e.isRead",
        "e.createdAt",
        "u.userId as actorId",
        "u.userName as actorName",
        "u.profileImage as actorImage",
      ])
      .where("e.recipientId", "=", recipientId)
      .orderBy("e.createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();
  }

  /**
   * 指定ユーザー宛の全承認通知を既読にする。
   *
   * @param recipientId - 通知の受信者
   */
  async markAllRead(recipientId: string) {
    await db
      .updateTable("followApprovalNotifications")
      .set({ isRead: 1 })
      .where("recipientId", "=", recipientId)
      .where("isRead", "=", 0)
      .execute();
  }

  /**
   * バックアップ用に、ユーザーが関わる全承認通知（受信・送信双方）を取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("followApprovalNotifications")
      .selectAll()
      .where((eb) =>
        eb.or([eb("recipientId", "=", userId), eb("actorId", "=", userId)]),
      )
      .execute();
  }

  /**
   * ユーザーが関わる全承認通知（受信・送信双方）を削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("followApprovalNotifications")
      .where((eb) =>
        eb.or([eb("recipientId", "=", userId), eb("actorId", "=", userId)]),
      )
      .execute();
  }
}

export const followApprovalNotificationsRepo =
  new FollowApprovalNotificationsRepository();
