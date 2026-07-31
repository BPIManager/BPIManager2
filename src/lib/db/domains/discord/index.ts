import { db } from "@/lib/db";
import type { Database, UserRole } from "@/types/db";
import type { Transaction } from "kysely";

/** Discord 連携で付与される BPI ロール（手動付与の developer/pro は対象外） */
const DISCORD_MANAGED_ROLES: UserRole[] = ["coffee", "saba", "iidx"];

class DiscordLinksRepository {
  async findByDiscordUserId(discordUserId: string) {
    return await db
      .selectFrom("discordLinks")
      .select(["discordUserId", "userId"])
      .where("discordUserId", "=", discordUserId)
      .executeTakeFirst();
  }

  async upsert(discordUserId: string, userId: string) {
    await db
      .insertInto("discordLinks")
      .values({ discordUserId, userId })
      .onDuplicateKeyUpdate({ userId })
      .execute();
  }

  async deleteByDiscordUserId(discordUserId: string) {
    await db
      .deleteFrom("discordLinks")
      .where("discordUserId", "=", discordUserId)
      .execute();
  }

  async upsertUserRole(userId: string, role: UserRole) {
    await db
      .insertInto("userRoles")
      .values({ userId, role })
      .onDuplicateKeyUpdate({ role })
      .execute();
  }

  async deleteDiscordUserRole(userId: string) {
    await db
      .deleteFrom("userRoles")
      .where("userId", "=", userId)
      .where("role", "in", DISCORD_MANAGED_ROLES)
      .execute();
  }

  async getUserRole(bpiUserId: string) {
    return await db
      .selectFrom("userRoles")
      .select(["role"])
      .where("userId", "=", bpiUserId)
      .executeTakeFirst();
  }

  async userExists(bpiUserId: string) {
    return await db
      .selectFrom("users")
      .select("userId")
      .where("userId", "=", bpiUserId)
      .executeTakeFirst();
  }

  /**
   * ユーザーのDiscord連携レコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteLinkByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("discordLinks").where("userId", "=", userId).execute();
  }

  /**
   * ユーザーのロールレコードを全て削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteRoleByUser(trx: Transaction<Database>, userId: string) {
    await trx.deleteFrom("userRoles").where("userId", "=", userId).execute();
  }

  /**
   * バックアップ用にユーザーのロールレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getRolesForUser(userId: string) {
    return await db
      .selectFrom("userRoles")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * バックアップ用にユーザーのDiscord連携レコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getLinksForUser(userId: string) {
    return await db
      .selectFrom("discordLinks")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }
}

export const discordLinksRepo = new DiscordLinksRepository();
