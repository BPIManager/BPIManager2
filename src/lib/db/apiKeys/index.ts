import { db } from "@/lib/db";

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
}

export const apiKeysRepo = new ApiKeysRepository();
