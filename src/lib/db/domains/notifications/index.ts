import { db } from "@/lib/db";
import { Transaction } from "kysely";
import { Database } from "@/types/db";

/**
 * notifications テーブル（通知の既読状態）の読み書き。集計・一覧は follows/scores/users/songs を横断するため aggregates/notifications に置く。
 */
export class NotificationsRepository {
  /**
   * ユーザーの最終既読日時を取得する。未読状態の場合は `undefined`。
   *
   * @param userId - ユーザー ID
   */
  async getLastReadAt(userId: string) {
    const meta = await db
      .selectFrom("notifications")
      .select("lastReadAt")
      .where("userId", "=", userId)
      .executeTakeFirst();

    return meta?.lastReadAt;
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
   * ユーザーの通知既読状態レコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("notifications")
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * バックアップ用にユーザーの通知既読状態レコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("notifications")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }
}

export const notificationsRepo = new NotificationsRepository();
