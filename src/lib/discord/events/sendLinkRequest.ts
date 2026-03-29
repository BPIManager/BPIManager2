import type { GuildMember } from "discord.js";

const PROMPT_MESSAGE = `BPIM2 へのご支援誠にありがとうございます!
Ci-en サポーターとして、プロフィールにロールを設定することができます。
ロールを設定したい BPIM2 のプロフィール URL を送信してください。

例: \`https://bpi2.poyashi.me/users/xxxxxxxxxxxxxxxxxxxxxxxx\`

URL を DM に貼り付けてそのまま送ってください。

※プロフィールURLがわからない場合:
①BPIM2へアクセスしてください↓
https://bpi2.poyashi.me/
②サイドメニューから「プロフィールを表示」をタップ
③自分のプロフィール画面が表示されたら、そのURLをコピーして送信`;

export async function sendLinkRequest(member: GuildMember) {
  await member.send(PROMPT_MESSAGE).catch(() => {
    console.warn(
      `[Discord Bot] DM を送れませんでした: ${member.user.tag} (${member.id})`,
    );
  });
}
