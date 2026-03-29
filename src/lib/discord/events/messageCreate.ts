import { ChannelType, type Client, type Message } from "discord.js";
import { discordLinksRepo } from "@/lib/db/discord";
import { getManagedRoleIds, resolveUserRoleFromMember } from "@/lib/discord/roleMap";

const BPI_USER_URL_PATTERN = /bpi2\.poyashi\.me\/users\/([A-Za-z0-9_-]+)/;

/**
 * DM でプロフィール URL を受信したとき、BPI アカウントと紐付ける。
 * ロールの付与・変更は Ci-en Bot が管理する
 */
export async function handleMessageCreate(message: Message, client: Client) {
  if (message.partial) {
    try {
      message = await message.fetch();
    } catch {
      console.warn("[Discord Bot] partial message fetch failed");
      return;
    }
  }

  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;

  console.log(
    `[Discord Bot] DM受信: "${message.content}" from ${message.author.tag}`,
  );

  const guildId = process.env.DISCORD_GUILD_ID;

  if (!guildId) {
    console.error("[Discord Bot] DISCORD_GUILD_ID が未設定です");
    return;
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.warn(`[Discord Bot] guild ${guildId} not in cache`);
    return;
  }

  const member = await guild.members.fetch(message.author.id).catch((e) => {
    console.warn(`[Discord Bot] member fetch failed: ${e}`);
    return null;
  });
  if (!member) return;

  const managedRoleIds = getManagedRoleIds();
  const hasManagedRole = member.roles.cache.some((r) =>
    managedRoleIds.includes(r.id),
  );
  if (!hasManagedRole) {
    console.log(`[Discord Bot] user ${message.author.tag} has no managed role`);
    return;
  }

  const match = message.content.match(BPI_USER_URL_PATTERN);
  if (!match) {
    console.log("[Discord Bot] URL pattern not matched");
    await message.reply(
      "BPIM2 のプロフィール URL が見つかりませんでした。\n以下の形式で URL を送ってください。\n\n例: `https://bpi2.poyashi.me/users/xxxxxxxxxxxxxxxxxxxxxxxx`",
    );
    return;
  }

  const bpiUserId = match[1];

  const userExists = await discordLinksRepo.userExists(bpiUserId);
  if (!userExists) {
    await message.reply(
      "指定されたユーザーが BPIM2 に見つかりませんでした。URL を確認してもう一度お試しください。",
    );
    return;
  }

  await discordLinksRepo.upsert(message.author.id, bpiUserId);

  const userRole = resolveUserRoleFromMember(
    member.roles.cache.map((r) => r.id),
  );
  if (userRole) {
    await discordLinksRepo.upsertUserRole(bpiUserId, userRole);
  }

  await message.reply(`BPIM2 アカウントに連携しました!
  プロフィールページにご支援バッヂが表示されるようになります。
  ※プランを変更した場合、バッヂは自動的に更新されます`);
}
