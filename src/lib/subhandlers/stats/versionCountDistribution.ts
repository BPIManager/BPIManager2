import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";
import { aggregateBestVersionCounts, pickBestVersionPerSong } from "./_shared";

/** 自己歴代ベストを出したバージョンごとの譜面件数。バージョン指定は使わず全バージョンを対象にする */
export async function handleStatsVersionCountDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const logs = await timelineRepo.listScoreLogs({
    userId: q.userId,
    levels: q.levels.map(Number),
    difficulties: q.difficulties,
  });
  return ok(
    aggregateBestVersionCounts(pickBestVersionPerSong(logs), {
      levels: q.levels,
      difficulties: q.difficulties,
    }),
  );
}
