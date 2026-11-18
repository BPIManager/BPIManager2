import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { IIDX_DIFFICULTIES, IIDX_LEVELS } from "@/constants/iidx/bpiDifficulties";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import type { StatsQuery } from "@/types/stats/query";
import { statsQuerySchema } from "@/schemas/stats/query";
import { invalidParams, writeV2Result } from "@/middlewares/api/apiResult";

function safeParseStatsQuery(query: NextApiRequest["query"]) {
  return statsQuerySchema.safeParse({
    userId: query.userId,
    version: query.version ?? latestVersion,
    level: query.level,
    difficulty: query.difficulty,
  });
}

function toStatsQuery(data: z.output<typeof statsQuerySchema>): StatsQuery {
  return {
    userId: data.userId,
    version: data.version,
    levels: data.level.filter((n) =>
      (IIDX_LEVELS as readonly string[]).includes(String(n)),
    ),
    difficulties: data.difficulty,
  };
}

export function parseStatsQuery(
  query: NextApiRequest["query"],
  res: NextApiResponse,
): StatsQuery | null {
  const parsed = safeParseStatsQuery(query);
  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Missing parameters",
    });
    return null;
  }
  return toStatsQuery(parsed.data);
}

/**
 * stats 系クエリが受け付けるパラメータの JSON Schema。zod スキーマから生成し、
 * 変換で落ちる列挙値（バージョン・レベル・難易度）は定数から補う。
 */
export function statsQueryJsonSchema(): unknown {
  const schema = z.toJSONSchema(statsQuerySchema, {
    io: "input",
    unrepresentable: "any",
  }) as { properties?: Record<string, Record<string, unknown>> };
  const p = schema.properties ?? {};
  if (p.version) p.version.enum = [...IIDX_VERSIONS];
  if (p.level?.items) (p.level.items as Record<string, unknown>).enum = IIDX_LEVELS.map(Number);
  if (p.difficulty?.items) (p.difficulty.items as Record<string, unknown>).enum = [...IIDX_DIFFICULTIES];
  return schema;
}

/** parseStatsQuery の v2 版。不正なときは v2 エンベロープ（errorDetails つき）で 400 を返す。メッセージは v1 と同じ */
export function parseStatsQueryV2(
  query: NextApiRequest["query"],
  res: NextApiResponse,
): StatsQuery | null {
  const parsed = safeParseStatsQuery(query);
  if (!parsed.success) {
    writeV2Result(
      res,
      invalidParams(parsed.error, statsQuerySchema, {
        in: "query",
        fallback: "Missing parameters",
        jsonSchema: statsQueryJsonSchema(),
      }),
    );
    return null;
  }
  return toStatsQuery(parsed.data);
}
