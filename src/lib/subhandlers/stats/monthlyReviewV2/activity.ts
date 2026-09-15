import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildActivityBreakdown, buildBestDays } from "@/lib/monthly-review/activity";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  computeOwnerMonthlyScores,
} from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewActivity(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd, useMonthBuckets } = resolveMonthlyReviewPeriod(
      q.month,
    );
    const [
      towerStats,
      towerRanking,
      dailyTowerData,
      breakdownRows,
      { latestInMonth },
      bpiTimeline,
    ] = await Promise.all([
      monthlyReviewRepo.getMonthlyTowerStats(q.userId, q.version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyTowerRanking(q.userId, q.version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyDailyTowerData(q.userId, q.version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyActivityBreakdownByLastPlayed(
        q.userId,
        q.version,
        monthStart,
        monthEnd,
      ),
      computeOwnerMonthlyScores(q.userId, q.version, monthStart, monthEnd),
      computeOwnerBpiTimeline(q.userId, q.version, monthStart, monthEnd, useMonthBuckets),
    ]);

    const { byDayOfWeek, byHour } = buildActivityBreakdown(breakdownRows);
    const bestDays = buildBestDays(dailyTowerData, bpiTimeline.history, bpiTimeline.bpiStart);

    return ok({
      ...towerStats,
      updatedSongs: latestInMonth.length,
      byDayOfWeek,
      byHour,
      towerRanking,
      bestDays,
    });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
