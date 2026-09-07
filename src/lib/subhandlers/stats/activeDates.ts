import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { ok } from "@/middlewares/api/apiResult";
import type { IIDXVersion } from "@/types/iidx/version";
import type { HandlerResult } from "@/types/api";

export async function handleStatsActiveDates(q: {
  userId: string;
  version: IIDXVersion;
}): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    [12],
  );
  return ok(activity.filter((d) => Number(d.count) > 0).map((d) => d.date));
}

/** GET stats/activity */
