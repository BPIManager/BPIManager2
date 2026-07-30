import { NextApiResponse } from "next";
import { getBaseUrl } from "@/lib/mcp/auth";

type ToolDoc = {
  name: string;
  desc: string;
};

const TOOLS: ToolDoc[] = [
  {
    name: "get_my_scores",
    desc: "自分のスコア一覧を取得(バージョン・クリア状況・BPI範囲・BPM範囲・notes数範囲・ソフラン曲・タイトル検索・日付指定・並び替え等で絞り込み可能)",
  },
  {
    name: "search_users",
    desc: "ユーザー名・IIDX ID・アリーナクラスでユーザーを検索(公開プロフィールのみ)",
  },
  { name: "get_my_follows", desc: "自分のフォロー中ユーザー一覧を取得" },
  {
    name: "get_user_scores",
    desc: "指定ユーザー(自分または公開プロフィールのユーザー)のスコア一覧を取得",
  },
  {
    name: "search_songs",
    desc: "楽曲マスタをタイトル・難易度・難易度レベルで検索し、songIdを取得",
  },
  {
    name: "update_my_score",
    desc: "自分のスコア・クリアランプを更新(自己ベストを上回る場合のみ反映)",
  },
  {
    name: "get_my_dashboard",
    desc: "スコア一覧を取得せずに、総合BPI・日別推移・単日BPI・得意曲/苦手曲/ライバル僅差曲TOP Nをまとめて取得",
  },
  {
    name: "get_song_rivals",
    desc: "特定の1曲について、自分とフォロー中ライバル全員の現在のスコアを一覧取得",
  },
];

type Example = { q: string; a: string };

const EXAMPLES: Example[] = [
  {
    q: "今のプレイデータから、AAA埋めまであと僅かな☆12を教えて",
    a: "get_my_scores を絞り込みなしに近い形で呼び出し、スコア率が近い曲を分析",
  },
  {
    q: "自分と○○さんの☆12レジェンダリア譜面のスコアを比較して",
    a: "search_users で相手を検索し、get_user_scores で互いのスコアを取得して比較",
  },
  {
    q: "IIDXID 1234-5678の人と自分のスコアを比較して",
    a: "search_users にIIDX IDを指定してユーザーを特定し、get_my_scores と get_user_scores で双方のスコアを取得して比較",
  },
  {
    q: "フォロー中の人で自分より総合BPIが高い人は? どの曲なら勝てそうですか。",
    a: "get_my_follows でフォロー一覧を取得し、各ユーザーのスコアと比較",
  },
  {
    q: "新曲『○○』の[A]をEXスコア1234、クリアランプHARD CLEARでスコア更新して",
    a: "search_songs で songId を検索し、update_my_score で更新(既存の自己ベストを上回らない場合は更新されない)",
  },
  {
    q: "リザルト画面のスクリーンショットを貼り付けて「このスコアで更新して」",
    a: "LLMが画像から曲名・難易度・EXスコア・クリアランプ・ミスカウントをOCRで読み取り、search_songs で songId を特定した上で update_my_score を呼び出す、という一連の流れをLLM側が自動で行う(BPIManager2側にOCR機能はなく、画像解釈はLLMクライアントの機能に依存する)",
  },
  {
    q: "今日はどの曲を伸ばせばいい？ライバルに追いつかれそうな曲もあれば教えて",
    a: "get_my_dashboard を呼び出し、苦手曲とライバル僅差曲を提示",
  },
  {
    q: "『○○』[A]で自分は○○さんに勝ってる？",
    a: "search_songs で songId を検索し、get_song_rivals で自分とライバルのスコアを比較",
  },
];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderStyle() {
  return `
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f7fb;
    --surface: #ffffff;
    --border: #e2e4ec;
    --text: #1c1e2b;
    --muted: #626578;
    --accent: #6d5efc;
    --accent-soft: #efeaff;
    --code-bg: #f0f1f7;
    --shadow: 0 1px 2px rgba(20, 20, 40, 0.04), 0 8px 24px rgba(20, 20, 40, 0.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1016;
      --surface: #171822;
      --border: #2a2c3a;
      --text: #eceefb;
      --muted: #9698ad;
      --accent: #a596ff;
      --accent-soft: #262244;
      --code-bg: #1e2030;
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.35);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN",
      "Noto Sans JP", Meiryo, sans-serif;
    line-height: 1.7;
  }
  main {
    max-width: 780px;
    margin: 0 auto;
    padding: 48px 20px 96px;
  }
  header.hero {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 8px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 20px;
    font-weight: 700;
    flex-shrink: 0;
  }
  h1 {
    font-size: 22px;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .lead {
    color: var(--muted);
    font-size: 14.5px;
    margin: 4px 0 32px;
  }
  section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px 26px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
  }
  h2 {
    font-size: 15px;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text);
  }
  h2::before {
    content: "";
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: var(--accent);
    display: inline-block;
  }
  p { margin: 0 0 12px; font-size: 14.5px; }
  p:last-child { margin-bottom: 0; }
  code {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1px 6px;
    font-size: 13px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .endpoint-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    margin-bottom: 14px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    overflow-x: auto;
    white-space: nowrap;
  }
  .method-tag {
    flex-shrink: 0;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.03em;
  }
  ul.tool-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  ul.tool-list li {
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
  }
  ul.tool-list code {
    background: var(--accent-soft);
    color: var(--accent);
    border: none;
    font-weight: 600;
  }
  ul.tool-list .tool-desc {
    display: block;
    margin-top: 4px;
    color: var(--muted);
    font-size: 13.5px;
  }
  .example {
    padding: 14px 0;
    border-top: 1px solid var(--border);
  }
  .example:first-child { border-top: none; padding-top: 0; }
  .example:last-child { padding-bottom: 0; }
  .example .q {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
  }
  .example .q::before {
    content: "Q. ";
    color: var(--accent);
  }
  .example .a {
    color: var(--muted);
    font-size: 13.5px;
    padding-left: 1.4em;
  }
  footer {
    text-align: center;
    color: var(--muted);
    font-size: 12.5px;
    margin-top: 32px;
  }
</style>`;
}

export function sendMcpInfoPage(res: NextApiResponse) {
  const baseUrl = getBaseUrl();
  const mcpUrl = `${baseUrl}/api/mcp`;
  const settingsUrl = `${baseUrl}/settings`;

  const toolsHtml = TOOLS.map(
    (t) =>
      `<li><code>${escapeHtml(t.name)}</code><span class="tool-desc">${escapeHtml(t.desc)}</span></li>`,
  ).join("\n");

  const examplesHtml = EXAMPLES.map(
    (e) =>
      `<div class="example"><div class="q">${escapeHtml(e.q)}</div><div class="a">→ ${escapeHtml(e.a)}</div></div>`,
  ).join("\n");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BPIM2 MCP</title>
${renderStyle()}
</head>
<body>
<main>
  <header class="hero">
    <h1>BPIM2 MCP</h1>
  </header>
  <p class="lead">beatmania IIDXのスコアデータをLLMクライアントから利用するための Model Context Protocol サーバーです。</p>

  <section>
    <h2>このエンドポイントについて</h2>
    <div class="endpoint-row"><span class="method-tag">POST</span><span>${escapeHtml(mcpUrl)}</span></div>
    <p>ブラウザから直接開いて使うページではなく、Streamable HTTP経由のPOSTリクエストのみを受け付けます。このページはPOST以外(GET)でアクセスした場合に案内として表示されています。</p>
  </section>

  <section>
    <h2>セットアップ方法</h2>
    <p>認証は OAuth 2.0 (Authorization Code + PKCE + Dynamic Client Registration) に対応しています。Claude等、DCRに対応したMCPクライアントであれば、上記URLをそのまま登録するだけでクライアント側が自動的にクライアント登録・認可フローを行うため、事前に<a href="${escapeHtml(settingsUrl)}">設定ページ</a>でOAuthクライアントを手動発行する必要はありません。</p>
    <p>DCRに対応していないクライアントを使う場合のみ、設定ページで発行したクライアントID/シークレットを利用してください。</p>
  </section>

  <section>
    <h2>利用可能なツール</h2>
    <ul class="tool-list">
${toolsHtml}
    </ul>
  </section>

  <section>
    <h2>活用例</h2>
${examplesHtml}
  </section>

</main>
</body>
</html>`);
}
