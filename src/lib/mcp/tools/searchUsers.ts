import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { usersRepo } from "@/lib/db/users";
import { searchUsersSchema, MCP_LIST_DEFAULT_LIMIT } from "@/lib/mcp/schemas";

export function registerSearchUsers(server: McpServer) {
  server.registerTool(
    "search_users",
    {
      title: "ユーザーを検索",
      description:
        `ユーザー名・IIDX ID・アリーナクラスでユーザーを検索する（公開プロフィールのユーザーのみ対象）。` +
        `絞り込み可能な項目: query(ユーザー名またはIIDX IDの部分一致。IIDX IDは半角数字8桁), ` +
        `arenaClass(アリーナクラスの完全一致), version(バージョン、デフォルト最新)。` +
        `返却件数は既定で${MCP_LIST_DEFAULT_LIMIT}件。limitパラメータで変更可能。`,
      inputSchema: searchUsersSchema.shape,
    },
    async ({ query, arenaClass, version, limit }) => {
      const rows = await usersRepo.searchUsers({
        query,
        arenaClass,
        version,
        limit: limit + 1,
      });
      const truncated = rows.length > limit;
      const items = truncated ? rows.slice(0, limit) : rows;

      const notice = truncated
        ? `該当件数がlimit(${limit})を超えています。先頭${limit}件のみ返却しました。` +
          `より絞り込むには query や arenaClass を指定してください。`
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
