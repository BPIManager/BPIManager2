import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildArena } from "@/lib/monthly-review/arena";
import { resolveMonthlyReviewPeriod } from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewArena(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd } = resolveMonthlyReviewPeriod(q.month);
    const arenaRows = await monthlyReviewRepo.getMonthlyArenaStats(
      q.userId,
      q.version,
      monthStart,
      monthEnd,
    );
    return ok({ arena: buildArena(arenaRows) });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
