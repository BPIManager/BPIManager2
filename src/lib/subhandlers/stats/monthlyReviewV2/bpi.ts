import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { resolveMonthlyReviewPeriod, computeOwnerBpiTimeline } from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewBpi(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd, useMonthBuckets } = resolveMonthlyReviewPeriod(
      q.month,
    );
    const { history, bpiStart, bpiEnd, bpiDiff } = await computeOwnerBpiTimeline(
      q.userId,
      q.version,
      monthStart,
      monthEnd,
      useMonthBuckets,
    );
    return ok({ start: bpiStart, end: bpiEnd, diff: bpiDiff, history });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
