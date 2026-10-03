import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * 非公開ユーザーへのフォローリクエスト（followRequests）の読み書き。保留中のみを保持し、承認・却下された行は削除する。
 * 承認時のみ followApprovalNotifications に通知を残す（却下は角が立つため通知・履歴を残さない）。
 */
class FollowRequestsRepository {
  /**
   * フォローリクエストを保留状態で作成する。同じ相手への保留中リクエストがあれば何もしない（招待URLの再クリック等の重複送信対策）。
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
   * 送信者→リクエスト先の組み合わせで保留中のリクエストがあるかを確認する。招待ページで「送信」か「取り下げ」かを最初から出し分けるために使う。
   *
   * @param requesterId - リクエストを送った側のユーザー ID
   * @param targetUserId - リクエスト先ユーザー ID
   */
  async existsPending(
    requesterId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const result = await db
      .selectFrom("followRequests")
      .select("id")
      .where("requesterId", "=", requesterId)
      .where("targetUserId", "=", targetUserId)
      .executeTakeFirst();

    return !!result;
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
   * フォローリクエストを承認・却下・取り下げにより解決する。呼び出し元は返り値で実削除を確認し、消費済みなら後続処理をスキップする。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param id - フォローリクエストID
   * @returns 削除対象の行が存在した場合は true
   */
  async deleteById(trx: Transaction<Database>, id: number): Promise<boolean> {
    const result = await trx
      .deleteFrom("followRequests")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * リクエスト先本人がリクエストを却下する。
   *
   * @param id - フォローリクエストID
   * @param targetUserId - 却下操作を行うユーザー ID（リクエスト先本人であることの確認に使う）
   * @returns 却下対象のリクエストが存在し、`targetUserId`がリクエスト先と一致した場合は `true`
   */
  async reject(id: number, targetUserId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("followRequests")
      .where("id", "=", id)
      .where("targetUserId", "=", targetUserId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
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
