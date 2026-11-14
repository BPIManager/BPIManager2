import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";
import { aggregateBestVersionCounts } from "./_shared";

/** 自己歴代ベストを出したバージョンごとの譜面件数。バージョン指定は使わず全バージョンを対象にする */
export async function handleStatsVersionCountDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const rows = await timelineRepo.getBestEverScores({
    userId: q.userId,
    currentVersion: q.version,
    excludeCurrent: false,
  });
  return ok(
    aggregateBestVersionCounts(
      rows.map((r) => ({
        bestExScore: r.bestExScore !== null ? Number(r.bestExScore) : null,
        bestVersion: r.bestVersion ?? null,
        difficultyLevel: Number(r.difficultyLevel),
        difficulty: r.difficulty,
      })),
      { levels: q.levels, difficulties: q.difficulties },
    ),
  );
}
