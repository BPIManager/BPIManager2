import type { GuildMember, PartialGuildMember } from "discord.js";
import { discordLinksRepo } from "@/lib/db/domains/discord";
import { getManagedRoleIds, resolveUserRoleFromMember } from "@/lib/discord/roleMap";
import { sendLinkRequest } from "./sendLinkRequest";

function isSameRoleSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * メンバーのロールが変化したとき:
 * - Coffee/Saba/Sparkle を新たに取得（Ci-en が付与）→ 未リンクならリンク案内 DM を送る、リンク済みならロールを付与
 * - Coffee/Saba/Sparkle を全て失った（Ci-en メンバーシップ終了）→ 紐付けと userRoles を削除する
 * - ロール変更（coffee→saba 等）→ リンク済みなら userRoles を更新する
 *
 * ロールの付与・削除は Ci-en Bot が管理するため、本 Bot は行わない。
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

  // 両方 managed role を持っている場合: ロール変更（coffee→saba 等）
  // managed role の集合が変わっていなければ、ニックネーム変更等の
  // 無関係なイベント発火のため何もしない
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
