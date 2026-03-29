import type { GuildMember, PartialGuildMember } from "discord.js";
import { discordLinksRepo } from "@/lib/db/discord";
import { getManagedRoleIds, resolveUserRoleFromMember } from "@/lib/discord/roleMap";
import { sendLinkRequest } from "./sendLinkRequest";

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
  const hadManagedRole = oldMember.roles.cache.some((r) =>
    managedRoleIds.includes(r.id),
  );
  const hasManagedRole = newMember.roles.cache.some((r) =>
    managedRoleIds.includes(r.id),
  );

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
  if (hadManagedRole && hasManagedRole) {
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
