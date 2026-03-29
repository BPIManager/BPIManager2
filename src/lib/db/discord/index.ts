import { db } from "@/lib/db";
import type { UserRole } from "@/types/db";

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
}

export const discordLinksRepo = new DiscordLinksRepository();
