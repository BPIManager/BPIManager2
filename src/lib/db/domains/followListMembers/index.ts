import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォローリストへのユーザー所属（`followListMembers` テーブル）の
 * 読み書きを担当するリポジトリクラス。
 *
 * `listId`の所有者チェック（呼び出し元が本当にそのリストの持ち主か）は
 * このリポジトリの責務外。呼び出し元（APIルート）が`followListsRepo`で
 * 事前に確認してから呼び出す。
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
   * アカウント削除時に、このユーザーが所属している全てのリスト所属
   * （他人が作成したリストへの所属も含む）を削除する。
   *
   * 所有者自身のリスト削除（`followListsRepo.deleteByUser`）は`listId`側の
   * `ON DELETE CASCADE`で連動するが、他人のリストに追加されている場合の
   * `followingId`側は別途明示的に削除する必要がある（`follows`テーブルの
   * `deleteByUser`が双方向を削除するのと同じ理由）。
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
   * フォロー解除時に、解除した相手を`ownerId`本人の全リストから外す。
   *
   * リストへの所属は「フォロー中であること」を前提にしているため
   * （追加時は`followsRepo.isFollowing`で確認済み）、フォロー解除後も
   * 所属レコードが残ると孤立データになる。`orchestrators/unfollow`から
   * `follows`削除と同一トランザクションで呼ばれる。
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
