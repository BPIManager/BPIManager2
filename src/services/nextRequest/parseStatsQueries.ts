import { latestVersion } from "@/constants/latestVersion";
import { IIDX_LEVELS } from "@/constants/diffs";
import type { NextApiRequest, NextApiResponse } from "next";
import type { StatsQuery } from "@/types/stats/query";
import { statsQuerySchema } from "@/schemas/stats/query";

export function parseStatsQuery(
  query: NextApiRequest["query"],
  res: NextApiResponse,
): StatsQuery | null {
  const parsed = statsQuerySchema.safeParse({
    userId: query.userId,
    version: query.version ?? latestVersion,
    level: query.level,
    difficulty: query.difficulty,
  });
  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Missing parameters",
    });
    return null;
  }
  return {
    userId: parsed.data.userId,
    version: parsed.data.version,
    levels: parsed.data.level.filter((n) =>
      (IIDX_LEVELS as readonly string[]).includes(String(n)),
    ),
    difficulties: parsed.data.difficulty,
  };
}
