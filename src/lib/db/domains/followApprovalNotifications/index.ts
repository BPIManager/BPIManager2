import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォローリクエスト承認通知（`followApprovalNotifications` テーブル）の
 * 読み書きを担当するリポジトリクラス。
 *
 * 却下・強制解除は相手に通知しない（角が立つため）。承認のみ通知する。
 * `follow`/`overtaken`通知(`aggregates/notifications`)と同じ`notifications`
 * テーブルの`lastReadAt`基準で既読を判定する（この行自体は削除されない
 * 恒久ログのため、`createdAt > lastReadAt`の絞り込みが機能する）。
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
   * @param lastRead - `notifications.lastReadAt`基準の既読境界時刻
   */
  async countUnreadSince(recipientId: string, lastRead: Date): Promise<number> {
    const result = await db
      .selectFrom("followApprovalNotifications")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("recipientId", "=", recipientId)
      .where("createdAt", ">", lastRead)
      .executeTakeFirst();

    return Number(result?.cnt ?? 0);
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
