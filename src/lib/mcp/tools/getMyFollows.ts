import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { followsRepo } from "@/lib/db/follow";
import { myFollowsSchema, MCP_LIST_DEFAULT_LIMIT } from "@/lib/mcp/schemas";

export function registerGetMyFollows(server: McpServer, userId: string) {
  server.registerTool(
    "get_my_follows",
    {
      title: "自分のフォロー一覧を取得",
      description:
        `認証済みユーザー自身のフォロー中ユーザー一覧を取得する。` +
        `非公開ユーザーは名前等がマスクされて返る。` +
        `page/limitでページネーション可能（1ページあたり既定${MCP_LIST_DEFAULT_LIMIT}件）。`,
      inputSchema: myFollowsSchema.shape,
    },
    async ({ version, page, limit }) => {
      const result = await followsRepo.getFollowList({
        targetUserId: userId,
        viewerId: userId,
        type: "following",
        version,
        page,
        limit,
      });

      const notice = `フォロー中${result.totalCount}人中${result.users.length}件を返却しました（page=${page}）。${result.hasMore ? "続きがあります。pageを増やして取得してください。" : "これで全件です。"}`;

      return {
        content: [
          { type: "text", text: notice },
          { type: "text", text: JSON.stringify(result.users) },
        ],
      };
    },
  );
}
