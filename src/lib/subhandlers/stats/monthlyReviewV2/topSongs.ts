import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerMonthlyScores,
  computeOwnerTopSongs,
} from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewTopSongs(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd } = resolveMonthlyReviewPeriod(q.month);
    const { latestInMonth } = await computeOwnerMonthlyScores(
      q.userId,
      q.version,
      monthStart,
      monthEnd,
    );
    const { topBpiSongs, topImprovedSongs } = await computeOwnerTopSongs(
      q.userId,
      q.version,
      monthStart,
      latestInMonth,
    );
    return ok({ topBpiSongs, topImprovedSongs });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
