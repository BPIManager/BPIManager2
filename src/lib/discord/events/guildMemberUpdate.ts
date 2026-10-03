import type { GuildMember, PartialGuildMember } from "discord.js";
import { discordLinksRepo } from "@/lib/db/domains/discord";
import { getManagedRoleIds, resolveUserRoleFromMember } from "@/lib/discord/roleMap";
import { sendLinkRequest } from "./sendLinkRequest";

function isSameRoleSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * ロール変化に応じて DM 案内・紐付け削除・userRoles 更新を行う。ロールの付与・削除自体は Ci-en Bot が管理するため本 Bot は行わない。
 * Coffee/Saba/Sparkle を全て失った場合（Ci-en メンバーシップ終了）は紐付けと userRoles を削除する。
 */
export async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
) {
  const managedRoleIds = getManagedRoleIds();
  const oldManagedRoleIds = oldMember.roles.cache
    .filter((r) => managedRoleIds.includes(r.id))
    .map((r) => r.id)
    .sort();
  const newManagedRoleIds = newMember.roles.cache
    .filter((r) => managedRoleIds.includes(r.id))
    .map((r) => r.id)
    .sort();
  const hadManagedRole = oldManagedRoleIds.length > 0;
  const hasManagedRole = newManagedRoleIds.length > 0;

  if (!hadManagedRole && hasManagedRole) {
    const existing = await discordLinksRepo.findByDiscordUserId(newMember.id);
    if (!existing) {
      await sendLinkRequest(newMember);
      return;
    }
    const userRole = resolveUserRoleFromMember(
      newMember.roles.cache.map((r) => r.id),
    );
    if (userRole) {
      await discordLinksRepo.upsertUserRole(existing.userId, userRole);
    }
    return;
  }

  if (hadManagedRole && !hasManagedRole) {
    const existing = await discordLinksRepo.findByDiscordUserId(newMember.id);
    if (existing) {
      await discordLinksRepo.deleteDiscordUserRole(existing.userId);
    }
    await discordLinksRepo.deleteByDiscordUserId(newMember.id);
    return;
  }

  // 両方に managed role がある場合は、ロールの集合が変わっていなければ（ニックネーム変更等の無関係なイベント）何もしない。
  if (
    hadManagedRole &&
    hasManagedRole &&
    !isSameRoleSet(oldManagedRoleIds, newManagedRoleIds)
  ) {
    const existing = await discordLinksRepo.findByDiscordUserId(newMember.id);
    if (!existing) return;
    const userRole = resolveUserRoleFromMember(
      newMember.roles.cache.map((r) => r.id),
    );
    if (userRole) {
      await discordLinksRepo.upsertUserRole(existing.userId, userRole);
    }
  }
}
