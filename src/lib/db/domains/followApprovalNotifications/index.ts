import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォローリクエスト承認通知（followApprovalNotifications）の読み書き。承認のみ通知し、却下・強制解除は相手に通知しない。
 * 既読は notifications テーブルの lastReadAt 基準で判定する（この行は恒久ログのため createdAt > lastReadAt が機能する）。
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
   * 承認通知を単独で記録する。承認記録の無い既存フォロワーを事後承認する場合など、follows は既に存在し他テーブルへの書き込みを伴わないケースで使う。
   *
   * @param recipientId - 通知の受信者（フォロワー）
   * @param actorId - 承認したユーザー
   */
  async recordApproval(recipientId: string, actorId: string) {
    await db
      .insertInto("followApprovalNotifications")
      .values({ recipientId, actorId })
      .execute();
  }

  /**
   * 指定の組み合わせに承認記録があるかを確認する。follows だけでは承認記録の無い既存フォローと区別できないため hasFollowAccess の判定に使う。
   *
   * @param recipientId - リクエスト送信者（フォロワー）側のユーザー ID
   * @param actorId - 承認した（された）側のユーザー ID
   */
  async existsForPair(recipientId: string, actorId: string): Promise<boolean> {
    const result = await db
      .selectFrom("followApprovalNotifications")
      .select("id")
      .where("recipientId", "=", recipientId)
      .where("actorId", "=", actorId)
      .executeTakeFirst();

    return !!result;
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
