

export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderStyle() {
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
