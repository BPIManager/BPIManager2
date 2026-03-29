import type { GuildMember, PartialGuildMember } from "discord.js";
import { discordLinksRepo } from "@/lib/db/discord";

/**
 * メンバーがサーバーを離れたとき、discordLinks の紐付けと userRoles を削除する。
 * Discord 側のロールはメンバー退出時に自動で消えるため操作不要。
 */
export async function handleGuildMemberRemove(
  member: GuildMember | PartialGuildMember,
) {
  const existing = await discordLinksRepo.findByDiscordUserId(member.id);
  if (existing) {
    await discordLinksRepo.deleteDiscordUserRole(existing.userId);
  }
  await discordLinksRepo.deleteByDiscordUserId(member.id);
}
