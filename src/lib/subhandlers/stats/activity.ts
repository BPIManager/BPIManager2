import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

export async function handleStatsActivity(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    q.levels,
    q.difficulties,
  );
  return ok(activity);
}
