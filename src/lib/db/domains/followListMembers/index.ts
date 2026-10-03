import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォローリストへのユーザー所属（followListMembers）の読み書き。listId の所有者確認は呼び出し元（APIルート）が followListsRepo で事前に行う。
 */
class FollowListMembersRepository {
  /**
   * リストにユーザーを追加する。既に所属済みの場合は何もしない。
   *
   * @param listId - リスト ID
   * @param followingId - 追加するユーザー ID
   */
  async addMember(listId: number, followingId: string) {
    await db
      .insertInto("followListMembers")
      .values({ listId, followingId })
      .onDuplicateKeyUpdate({ listId })
      .execute();
  }

  /**
   * リストからユーザーを削除する。
   *
   * @param listId - リスト ID
   * @param followingId - 削除するユーザー ID
   * @returns 削除対象が存在した場合は `true`
   */
  async removeMember(listId: number, followingId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("followListMembers")
      .where("listId", "=", listId)
      .where("followingId", "=", followingId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * 指定リストの所属ユーザーID一覧を取得する。
   *
   * @param listId - リスト ID
   */
  async getFollowingIdsForList(listId: number): Promise<string[]> {
    const rows = await db
      .selectFrom("followListMembers")
      .select("followingId")
      .where("listId", "=", listId)
      .execute();

    return rows.map((r) => r.followingId);
  }

  /**
   * 指定リストID群に属する所属レコードを全て取得する。
   *
   * アカウント削除前のバックアップ用（所有リストの所属構成を保存する）。
   *
   * @param listIds - リスト ID の配列
   */
  async getAllForLists(listIds: number[]) {
    if (listIds.length === 0) return [];
    return await db
      .selectFrom("followListMembers")
      .selectAll()
      .where("listId", "in", listIds)
      .execute();
  }

  /**
   * アカウント削除時に、このユーザーが所属する全リスト所属（他人のリストへの所属を含む）を削除する。
   * 自分のリストは listId 側の ON DELETE CASCADE で連動するが、他人のリストは followingId 側を明示削除する必要がある。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param followingId - 削除対象ユーザー ID
   */
  async deleteByFollowing(trx: Transaction<Database>, followingId: string) {
    await trx
      .deleteFrom("followListMembers")
      .where("followingId", "=", followingId)
      .execute();
  }

  /**
   * フォロー解除時に解除相手を ownerId 本人の全リストから外す。所属はフォロー中を前提とするため、残すと孤立データになる。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param ownerId - リスト所有者（フォローを解除した側）のユーザー ID
   * @param followingId - フォロー解除された（リストから外す）ユーザー ID
   */
  async deleteByFollowingForOwner(
    trx: Transaction<Database>,
    ownerId: string,
    followingId: string,
  ) {
    await trx
      .deleteFrom("followListMembers")
      .where("followingId", "=", followingId)
      .where(
        "listId",
        "in",
        trx.selectFrom("followLists").select("id").where("userId", "=", ownerId),
      )
      .execute();
  }
}

export const followListMembersRepo = new FollowListMembersRepository();
