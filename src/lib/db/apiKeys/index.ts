import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Transaction } from "kysely";

class ApiKeysRepository {
  async findByKey(key: string) {
    return db
      .selectFrom("apiKeys")
      .select(["userId", "key"])
      .where("key", "=", key)
      .executeTakeFirst();
  }

  async findByUserId(userId: string) {
    return db
      .selectFrom("apiKeys")
      .select("key")
      .where("userId", "=", userId)
      .executeTakeFirst();
  }

  async upsert(userId: string, key: string) {
    return db
      .insertInto("apiKeys")
      .values({
        userId,
        key,
        createdAt: new Date(),
      })
      .onDuplicateKeyUpdate({ key })
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
}

export const apiKeysRepo = new ApiKeysRepository();
