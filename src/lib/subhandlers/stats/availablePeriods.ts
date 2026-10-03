import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsAvailablePeriods(q: {
  userId: string;
  version: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const months = await monthlyActivityRepo.getAvailableMonths(
      q.userId,
      q.version,
    );
    return ok({ months });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
