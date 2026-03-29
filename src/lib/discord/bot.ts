import { Client, GatewayIntentBits, Partials } from "discord.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate";
import { handleGuildMemberRemove } from "./events/guildMemberRemove";
import { handleMessageCreate } from "./events/messageCreate";

export function startDiscordBot() {
  if (process.env.NODE_ENV === "development") {
    console.warn("[Discord Bot] 開発環境のため起動をスキップします");
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn(
      "[Discord Bot] DISCORD_BOT_TOKEN が未設定のため起動をスキップします",
    );
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once("ready", (c) => {
    console.log(`[Discord Bot] ${c.user.tag} としてログインしました`);
  });

  client.on("guildMemberAdd", handleGuildMemberAdd);

  client.on("guildMemberUpdate", handleGuildMemberUpdate);

  client.on("guildMemberRemove", handleGuildMemberRemove);

  client.on("messageCreate", (message) => handleMessageCreate(message, client));

  client.login(token).catch((err) => {
    console.error("[Discord Bot] ログインに失敗しました:", err);
  });
}
