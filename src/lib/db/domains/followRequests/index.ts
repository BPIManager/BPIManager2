import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * 非公開ユーザーへのフォローリクエスト（`followRequests` テーブル）の
 * 読み書きを担当するリポジトリクラス。
 *
 * このテーブルは保留中のリクエストのみを保持する。承認/却下されたリクエストは
 * 行ごと削除し（`follows`自体に取り消し済み行を置かないのと同じ設計）、
 * 履歴は`domains/followNotificationEvents`の通知ログに残す。
 */
class FollowRequestsRepository {
  /**
   * フォローリクエストを送信する（保留状態で作成）。
   *
   * 既に同じ相手への保留中リクエストがある場合は何もしない
   * （招待URLの再クリック等での重複送信に対応）。
   *
   * @param requesterId - リクエストを送る側のユーザー ID
   * @param targetUserId - リクエスト先（非公開ユーザー）の ID
   */
  async create(requesterId: string, targetUserId: string) {
    await db
      .insertInto("followRequests")
      .values({ requesterId, targetUserId })
      .onDuplicateKeyUpdate({ requesterId })
      .execute();
  }

  /**
   * 指定IDのフォローリクエストを取得する。
   *
   * @param id - フォローリクエストID
   */
  async getById(id: number) {
    return await db
      .selectFrom("followRequests")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザー宛の保留中フォローリクエスト件数を取得する。
   *
   * 通知バッジの「承認待ち件数」に使う。
   *
   * @param targetUserId - リクエスト先ユーザー ID
   */
  async countPendingForTarget(targetUserId: string): Promise<number> {
    const result = await db
      .selectFrom("followRequests")
      .select((eb) => eb.fn.countAll<number>().as("cnt"))
      .where("targetUserId", "=", targetUserId)
      .executeTakeFirst();

    return Number(result?.cnt ?? 0);
  }

  /**
   * フォローリクエストを取り消す/承認・却下により解決する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param id - フォローリクエストID
   */
  async deleteById(trx: Transaction<Database>, id: number) {
    await trx.deleteFrom("followRequests").where("id", "=", id).execute();
  }

  /**
   * リクエスト送信者本人がリクエストを取り下げる。
   *
   * @param requesterId - リクエストを送った側のユーザー ID
   * @param targetUserId - リクエスト先ユーザー ID
   * @returns 取り下げ対象のリクエストが存在した場合は `true`
   */
  async withdraw(
    requesterId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const result = await db
      .deleteFrom("followRequests")
      .where("requesterId", "=", requesterId)
      .where("targetUserId", "=", targetUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * バックアップ用に、ユーザーが関わる全フォローリクエスト
   * （送信・受信双方）を取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("followRequests")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("requesterId", "=", userId),
          eb("targetUserId", "=", userId),
        ]),
      )
      .execute();
  }

  /**
   * ユーザーが関わる全フォローリクエスト（送信・受信双方）を削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("followRequests")
      .where((eb) =>
        eb.or([
          eb("requesterId", "=", userId),
          eb("targetUserId", "=", userId),
        ]),
      )
      .execute();
  }
}

export const followRequestsRepo = new FollowRequestsRepository();
