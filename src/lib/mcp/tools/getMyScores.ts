import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpScoresQuerySchema, MCP_SCORES_DEFAULT_LIMIT } from "@/lib/mcp/schemas";
import { buildScoresResponse } from "./_scoresResponse";

export function registerGetMyScores(server: McpServer, userId: string) {
  server.registerTool(
    "get_my_scores",
    {
      title: "自分のスコア一覧を取得",
      description:
        `認証済みユーザー自身のbeatmania IIDXスコア一覧を取得する。` +
        `絞り込みなしだとプレイ済み全曲（数百〜数千件）を返しレスポンスが非常に大きくなるため、` +
        `目的に応じて必ず絞り込みパラメータを使うこと。` +
        `絞り込み可能な項目: version(バージョン), clearState(クリア状況), ` +
        `bpiMin/bpiMax(BPI範囲), bpmMin/bpmMax(BPM範囲), notesMin/notesMax(notes数範囲), ` +
        `isSofran(ソフラン曲のみ), search(タイトル部分一致), asOf(日付を指定することでタイムマシン的に当時のスコアを取得可能), ` +
        `sortKey/sortOrder(並び替え)。` +
        `返却件数は既定で${MCP_SCORES_DEFAULT_LIMIT}件。limitパラメータで変更可能。` +
        `該当件数がlimitを超える場合は先頭からlimit件のみ返し、全体件数を通知する。`,
      inputSchema: mcpScoresQuerySchema.shape,
    },
    async (query) => buildScoresResponse(userId, query),
  );
}
