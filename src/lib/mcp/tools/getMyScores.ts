import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dayjs from "@/lib/dayjs";
import { scoreDetailRepo } from "@/lib/db/domains/scores";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { mcpScoresQuerySchema, MCP_SCORES_DEFAULT_LIMIT } from "@/lib/mcp/schemas";

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
    async ({ version, asOf, limit, ...filterParams }) => {
      const time =
        !asOf || asOf === "latest"
          ? dayjs.tz().utc().toDate()
          : dayjs.tz(asOf).utc().toDate();

      const results = await scoreDetailRepo.getScoresWithDetails(userId, version, {
        targetTime: time,
      });

      const songs = results.map(mapToFlatSong);
      const processed = sortSongs(
        filterSongsServerSide(songs, filterParams),
        filterParams,
      );

      const totalCount = processed.length;
      const truncated = totalCount > limit;
      const items = truncated ? processed.slice(0, limit) : processed;

      const notice = truncated
        ? `該当${totalCount}件中、先頭${limit}件のみ返却しました。` +
          `残りを見るには limit を増やすか、` +
          `clearState/bpiMin/bpiMax/bpmMin/bpmMax/notesMin/notesMax/isSofran/search 等で絞り込んでください。`
        : `該当${totalCount}件を返却しました。`;

      return {
        content: [
          { type: "text", text: notice },
          { type: "text", text: JSON.stringify(items) },
        ],
      };
    },
  );
}
