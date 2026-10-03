import { NextApiResponse } from "next";
import { getBaseUrl } from "@/lib/mcp/auth";
import { TOOLS, EXAMPLES } from "@/lib/mcp/infoPage/content";
import { escapeHtml, renderStyle } from "@/lib/mcp/infoPage/style";

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
  <p class="lead">BPIM2に登録されたbeatmania IIDXのスコアデータをLLMクライアントから利用するための Model Context Protocol サーバーです。</p>

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
