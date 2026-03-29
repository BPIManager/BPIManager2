import type { GuildMember } from "discord.js";
import { discordLinksRepo } from "@/lib/db/discord";
import { getManagedRoleIds } from "@/lib/discord/roleMap";
import { sendLinkRequest } from "./sendLinkRequest";

/**
 * メンバーがサーバーに参加したとき、すでに Coffee/Saba/Sparkle を持っていれば
 * 未リンクの場合のみリンク案内 DM を送る。
 */
export async function handleGuildMemberAdd(member: GuildMember) {
  const managedRoleIds = getManagedRoleIds();
  const hasManagedRole = member.roles.cache.some((r) =>
    managedRoleIds.includes(r.id),
  );
  if (!hasManagedRole) return;

  const existing = await discordLinksRepo.findByDiscordUserId(member.id);
  if (existing) return;

  await sendLinkRequest(member);
}
