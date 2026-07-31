import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { songsRepo } from "@/lib/db/domains/songs";
import { searchSongsSchema, MCP_LIST_DEFAULT_LIMIT } from "@/lib/mcp/schemas";

export function registerSearchSongs(server: McpServer) {
  server.registerTool(
    "search_songs",
    {
      title: "楽曲マスタを検索",
      description:
        `楽曲マスタをタイトル・難易度・難易度レベルで検索し、songIdを取得する。` +
        `絞り込み可能な項目: title(タイトル部分一致), difficulty(難易度の完全一致), ` +
        `difficultyLevel(難易度レベルの完全一致), version(バージョン、デフォルト最新)。` +
        `返却件数は既定で${MCP_LIST_DEFAULT_LIMIT}件。limitパラメータで変更可能。` +
        `ここで得たsongIdはupdate_my_scoreでそのまま使えるが、` +
        `songDef（BPI定義）が存在しない楽曲（主に難易度レベル10以下等）はupdate_my_scoreで更新できない点に注意。`,
      inputSchema: searchSongsSchema.shape,
    },
    async ({ version, title, difficulty, difficultyLevel, limit }) => {
      const rows = await songsRepo.searchSongs({
        version,
        title,
        difficulty,
        difficultyLevel,
        limit: limit + 1,
      });
      const truncated = rows.length > limit;
      const items = truncated ? rows.slice(0, limit) : rows;

      const notice = truncated
        ? `該当件数がlimit(${limit})を超えています。先頭${limit}件のみ返却しました。` +
          `より絞り込むには title/difficulty/difficultyLevel を指定してください。`
        : `${items.length}件を返却しました。`;

      return {
        content: [
          { type: "text", text: notice },
          { type: "text", text: JSON.stringify(items) },
        ],
      };
    },
  );
}
