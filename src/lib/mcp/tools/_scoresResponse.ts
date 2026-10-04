import dayjs from "@/lib/dayjs";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import type { z } from "zod";
import type { mcpScoresQuerySchema } from "@/lib/mcp/schemas";

type ScoresQuery = z.output<typeof mcpScoresQuerySchema>;

/**
 * 指定ユーザーのスコアを絞り込み・並び替え・件数制限して MCP の content 形式で返す。get_my_scores / get_user_scores で共通。
 *
 * @param targetUserId - スコアを取得する対象ユーザー（アクセス権チェックは呼び出し側で済ませる）
 * @param query - バージョン・asOf・limit と絞り込み・並び替え条件
 */
export async function buildScoresResponse(
  targetUserId: string,
  { version, asOf, limit, ...filterParams }: ScoresQuery,
) {
  const time =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(asOf).utc().toDate();

  const results = await scoreDetailRepo.getScoresWithDetails(
    targetUserId,
    version,
    {
      targetTime: time,
      clearState: filterParams.clearState,
      bpiMin: filterParams.bpiMin,
      bpiMax: filterParams.bpiMax,
      notesMin: filterParams.notesMin,
      notesMax: filterParams.notesMax,
    },
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
      { type: "text" as const, text: notice },
      { type: "text" as const, text: JSON.stringify(items) },
    ],
  };
}
