import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";
import { hashCredential } from "@/utils/common/hashCredential";

/**
 * APIキーはハッシュ(`key`)で保存し、表示用に末尾4文字(`keyLast4`)を別列に持つ。
 * 引数の `key` は平文のAPIキー。
 */
class ApiKeysRepository {
  async findByKey(key: string) {
    return db
      .selectFrom("apiKeys")
      .select(["userId", "key"])
      .where("key", "=", hashCredential(key))
      .executeTakeFirst();
  }

  async findByUserId(userId: string) {
    return db
      .selectFrom("apiKeys")
      .select("keyLast4")
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  async upsert(userId: string, key: string) {
    const hashed = hashCredential(key);
    const keyLast4 = key.slice(-4);
    return db
      .insertInto("apiKeys")
      .values({
        userId,
        key: hashed,
        keyLast4,
        createdAt: new Date(),
      })
      .onDuplicateKeyUpdate({ key: hashed, keyLast4 })
      .execute();
  }

  /**
   * ユーザーのAPIキーレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("apiKeys").where("userId", "=", userId).execute();
  }

  /**
   * バックアップ用にユーザーのAPIキーレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("apiKeys")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }
}

export const apiKeysRepo = new ApiKeysRepository();
