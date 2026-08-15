import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * フォロー中ユーザーを分類するリスト（`followLists` テーブル）の
 * 読み書きを担当するリポジトリクラス。
 *
 * リストは常に本人のみが読み書きできる（`isPublic`は将来の第三者閲覧用に
 * 保持するだけの値で、現時点ではどのAPIも第三者への公開判定には使わない）。
 * そのため各メソッドは`userId`を必須の所有者チェック条件として受け取る。
 */
class FollowListsRepository {
  /**
   * リストを作成する。
   *
   * @param userId - 作成者のユーザー ID
   * @param name - リスト名
   * @param isPublic - 公開設定
   * @returns 作成したリストの ID
   */
  async create(
    userId: string,
    name: string,
    isPublic: boolean,
  ): Promise<number> {
    const result = await db
      .insertInto("followLists")
      .values({ userId, name, isPublic: isPublic ? 1 : 0 })
      .executeTakeFirstOrThrow();

    return Number(result.insertId);
  }

  /**
   * IDを指定してリストを取得する。
   *
   * @param id - リスト ID
   */
  async getById(id: number) {
    return await db
      .selectFrom("followLists")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * 指定ユーザーが作成した全リストを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("followLists")
      .selectAll()
      .where("userId", "=", userId)
      .orderBy("createdAt", "asc")
      .execute();
  }

  /**
   * リスト名・公開設定を更新する（指定したフィールドのみ）。
   *
   * 改名と公開設定変更を別々のUPDATE文にすると、片方が失敗した場合に
   * 中途半端な状態のまま確定してしまうため、1つのUPDATE文にまとめて
   * 原子的に反映する。
   *
   * @param id - リスト ID
   * @param userId - 操作者のユーザー ID（所有者本人であることの確認に使う）
   * @param fields - 更新するフィールド（`undefined`のフィールドは更新しない）
   * @returns 対象のリストが存在し、所有者が一致した場合は `true`
   */
  async update(
    id: number,
    userId: string,
    fields: { name?: string; isPublic?: boolean },
  ): Promise<boolean> {
    const set: { name?: string; isPublic?: number } = {};
    if (fields.name !== undefined) set.name = fields.name;
    if (fields.isPublic !== undefined) set.isPublic = fields.isPublic ? 1 : 0;

    const result = await db
      .updateTable("followLists")
      .set(set)
      .where("id", "=", id)
      .where("userId", "=", userId)
      .executeTakeFirst();

    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * リストを削除する（所属メンバーは`ON DELETE CASCADE`で連動削除される）。
   *
   * @param id - リスト ID
   * @param userId - 操作者のユーザー ID（所有者本人であることの確認に使う）
   * @returns 対象のリストが存在し、所有者が一致した場合は `true`
   */
  async remove(id: number, userId: string): Promise<boolean> {
    const result = await db
      .deleteFrom("followLists")
      .where("id", "=", id)
      .where("userId", "=", userId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * アカウント削除時に、ユーザーが作成した全リストを削除する
   * （所属メンバーは`ON DELETE CASCADE`で連動削除される）。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("followLists").where("userId", "=", userId).execute();
  }
}

export const followListsRepo = new FollowListsRepository();
