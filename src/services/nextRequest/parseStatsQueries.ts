import { latestVersion } from "@/constants/latestVersion";
import { parseArray } from "@/utils/common/parseArray";
import type { NextApiRequest } from "next";

export interface StatsQuery {
  userId: string;
  version: string;
  levels: number[];
  difficulties: string[];
}

export function parseStatsQuery(query: NextApiRequest["query"]): StatsQuery {
  return {
    userId: String(query.userId ?? ""),
    version: String(query.version ?? latestVersion),
    levels: parseArray(query.level).map(Number),
    difficulties: parseArray(query.difficulty),
  };
}
