import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dayjs from "@/lib/dayjs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { checkSelfOrPublicAccess } from "@/lib/mcp/auth";
import {
  mcpUserScoresQuerySchema,
  MCP_SCORES_DEFAULT_LIMIT,
} from "@/lib/mcp/schemas";

export function registerGetUserScores(server: McpServer, userId: string) {
  server.registerTool(
    "get_user_scores",
    {
      title: "指定ユーザーのスコア一覧を取得",
      description:
        `指定したuserIdのbeatmania IIDXスコア一覧を取得する。自分自身は常に閲覧可能、` +
        `他ユーザーは公開プロフィール(isPublic)のユーザーのみ閲覧可能（フォローの有無は影響しない）。` +
        `絞り込みなしだとプレイ済み全曲（数百〜数千件）を返しレスポンスが非常に大きくなるため、` +
        `目的に応じて必ず絞り込みパラメータを使うこと。` +
        `絞り込み可能な項目: version(バージョン), clearState(クリア状況), ` +
        `bpiMin/bpiMax(BPI範囲), bpmMin/bpmMax(BPM範囲), notesMin/notesMax(notes数範囲), ` +
        `isSofran(ソフラン曲のみ), search(タイトル部分一致), asOf(日付を指定することでタイムマシン的に当時のスコアを取得可能), ` +
        `sortKey/sortOrder(並び替え)。` +
        `返却件数は既定で${MCP_SCORES_DEFAULT_LIMIT}件。limitパラメータで変更可能。` +
        `該当件数がlimitを超える場合は先頭からlimit件のみ返し、全体件数を通知する。`,
      inputSchema: mcpUserScoresQuerySchema.shape,
    },
    async ({ userId: targetUserId, version, asOf, limit, ...filterParams }) => {
      const access = await checkSelfOrPublicAccess(userId, targetUserId);
      if (!access.allowed) {
        return { content: [{ type: "text", text: access.message }] };
      }

      const time =
        !asOf || asOf === "latest"
          ? dayjs.tz().utc().toDate()
          : dayjs.tz(asOf).utc().toDate();

      const results = await scoresRepo.getScoresWithDetails(
        targetUserId,
        version,
        { targetTime: time },
      );

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
