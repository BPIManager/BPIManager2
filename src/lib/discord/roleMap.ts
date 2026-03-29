import type { UserRole } from "@/types/db";

/**
 * Ci-en Bot が管理する Discord ロール ID の一覧。
 * ロールの付与・削除は Ci-en Bot が行うため、本 Bot はこれらを監視するためだけに使用する。
 */
export function getManagedRoleIds(): string[] {
  return [
    process.env.DISCORD_COFFEE_ROLE_ID,
    process.env.DISCORD_SABA_ROLE_ID,
    process.env.DISCORD_SPARKLE_ROLE_ID,
  ].filter((id): id is string => !!id);
}

/** Discord ロール ID → BPI ユーザーロール のマッピング */
export function getDiscordRoleToUserRole(): Map<string, UserRole> {
  const map = new Map<string, UserRole>();
  if (process.env.DISCORD_COFFEE_ROLE_ID)
    map.set(process.env.DISCORD_COFFEE_ROLE_ID, "coffee");
  if (process.env.DISCORD_SABA_ROLE_ID)
    map.set(process.env.DISCORD_SABA_ROLE_ID, "saba");
  if (process.env.DISCORD_SPARKLE_ROLE_ID)
    map.set(process.env.DISCORD_SPARKLE_ROLE_ID, "iidx");
  return map;
}

/** GuildMember が持つ managed ロールのうち最初の BPI ロールを返す */
export function resolveUserRoleFromMember(
  roleIds: string[],
): UserRole | undefined {
  const mapping = getDiscordRoleToUserRole();
  for (const id of roleIds) {
    const role = mapping.get(id);
    if (role) return role;
  }
  return undefined;
}
