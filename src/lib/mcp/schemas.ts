import { z } from "zod";
import { scoresQuerySchema } from "@/schemas/scores/query";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

// MCP経由の応答はそのままLLMの会話コンテキストに載ってトークンを消費するため、
// REST API (scores.ts) とは別にMCP側だけデフォルトの件数上限を設ける。
// (明示的にlimitを大きく指定した場合はそれを尊重し、強制的な上限は設けない)
export const MCP_SCORES_DEFAULT_LIMIT = 100;
export const MCP_LIST_DEFAULT_LIMIT = 50;
export const DASHBOARD_DEFAULT_HISTORY_DAYS = 30;
export const DASHBOARD_DEFAULT_TOP_SONGS_LIMIT = 10;

export const mcpVersionSchema = scoresQuerySchema.shape.version;

export const mcpScoresQuerySchema = scoresQuerySchema.extend({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(MCP_SCORES_DEFAULT_LIMIT)
    .describe(
      `返却する最大件数（デフォルト${MCP_SCORES_DEFAULT_LIMIT}件）。絞り込み条件と組み合わせて必要な範囲だけ取得すること。`,
    ),
});

export const mcpUserScoresQuerySchema = mcpScoresQuerySchema.extend({
  userId: z
    .string()
    .min(1)
    .describe("スコアを取得する対象ユーザーのuserId（search_usersやget_my_followsの結果から取得できる）"),
});

export const searchUsersSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "ユーザー名またはIIDX IDの部分一致検索。IIDX IDは常に半角数字8桁のみで構成されるため、" +
        "IIDX IDで検索する場合は数字8桁をそのまま指定すること（ハイフンや空白を含めない）。",
    ),
  arenaClass: z
    .string()
    .optional()
    .describe("アリーナクラス（皆伝/中伝など）の完全一致フィルタ"),
  version: mcpVersionSchema,
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(MCP_LIST_DEFAULT_LIMIT)
    .describe(`返却する最大件数（デフォルト${MCP_LIST_DEFAULT_LIMIT}件）`),
});

export const myFollowsSchema = z.object({
  version: mcpVersionSchema,
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(MCP_LIST_DEFAULT_LIMIT)
    .describe(`1ページあたりの最大件数（デフォルト${MCP_LIST_DEFAULT_LIMIT}件）`),
});

export const searchSongsSchema = z.object({
  version: mcpVersionSchema,
  title: z.string().optional().describe("楽曲タイトルの部分一致検索"),
  difficulty: z
    .string()
    .optional()
    .describe("難易度表記の完全一致（例: NORMAL, HYPER, ANOTHER, LEGGENDARIA）"),
  difficultyLevel: z.coerce.number().int().min(1).max(12).optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(MCP_LIST_DEFAULT_LIMIT)
    .describe(`返却する最大件数（デフォルト${MCP_LIST_DEFAULT_LIMIT}件）`),
});

export const LAMP_STATES = [
  "FAILED",
  "ASSIST CLEAR",
  "EASY CLEAR",
  "CLEAR",
  "HARD CLEAR",
  "EX HARD CLEAR",
  "FULLCOMBO CLEAR",
] as const;

export const updateMyScoreSchema = z.object({
  songId: z
    .coerce.number()
    .int()
    .positive()
    .describe("更新対象の楽曲songId（search_songsの結果から取得すること）"),
  version: mcpVersionSchema,
  exScore: z.coerce.number().int().min(0),
  clearState: z.enum(LAMP_STATES),
  missCount: z.coerce.number().int().min(0).optional(),
});

export const dashboardSchema = z.object({
  version: mcpVersionSchema,
  levels: z
    .array(z.enum(IIDX_LEVELS))
    .optional()
    .default([...IIDX_LEVELS])
    .describe(
      `集計対象の難易度レベル（"11"または"12"、複合指定可。省略時は${IIDX_LEVELS.join("/")}の両方が対象）。` +
        `totalBpi/estimatedRank（総合BPI本体）は皆伝ランキングの公式ルール上、常にレベル12のみで計算されるため` +
        `このパラメータの影響を受けない。totalBpiHistory/dailyBpi/strongSongs/weakSongs/closeRivalSongsの` +
        `絞り込みにのみ影響する。`,
    ),
  difficulties: z
    .array(z.enum(IIDX_DIFFICULTIES))
    .optional()
    .default([])
    .describe(
      `集計対象の難易度種別（HYPER/ANOTHER/LEGGENDARIA、複合指定可。空配列（デフォルト）は全難易度が対象）。` +
        `levelsと同様、totalBpi/estimatedRankには影響せず、それ以外の集計項目にのみ影響する。`,
    ),
  historyDays: z.coerce
    .number()
    .int()
    .positive()
    .max(90)
    .default(DASHBOARD_DEFAULT_HISTORY_DAYS)
    .describe(
      `総合BPIの日別推移・単日BPIを遡る日数（デフォルト${DASHBOARD_DEFAULT_HISTORY_DAYS}日、最大90日）。`,
    ),
  topSongsLimit: z.coerce
    .number()
    .int()
    .positive()
    .max(30)
    .default(DASHBOARD_DEFAULT_TOP_SONGS_LIMIT)
    .describe(
      `得意曲/苦手曲/ライバル僅差曲それぞれの返却件数（デフォルト${DASHBOARD_DEFAULT_TOP_SONGS_LIMIT}件）。`,
    ),
});

export const songRivalsSchema = z.object({
  songId: z
    .coerce.number()
    .int()
    .positive()
    .describe("対象楽曲のsongId（search_songsの結果から取得すること）"),
  version: mcpVersionSchema,
});
