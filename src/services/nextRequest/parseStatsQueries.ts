import { latestVersion } from "@/constants/latestVersion";
import { parseArray } from "@/utils/common/parseArray";
import type { NextApiRequest } from "next";
import type { StatsQuery } from "@/types/stats/query";

export function parseStatsQuery(query: NextApiRequest["query"]): StatsQuery {
  return {
    userId: String(query.userId ?? ""),
    version: String(query.version ?? latestVersion),
    levels: parseArray(query.level).map(Number),
    difficulties: parseArray(query.difficulty),
  };
}
