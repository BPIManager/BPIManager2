import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";
import { buildActivityBreakdown, buildBestDays } from "@/lib/monthly-review/activity";
import { resolveMonthlyReviewPeriod } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { computeOwnerBpiTimeline } from "@/lib/subhandlers/stats/monthlyReviewV2/timeline";
import { computeOwnerMonthlyScores } from "@/lib/subhandlers/stats/monthlyReviewV2/scores";
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
      { latestInMonth, songUpdateDateMap },
      bpiTimeline,
    ] = await Promise.all([
      monthlyActivityRepo.getMonthlyTowerStats(q.userId, q.version, monthStart, monthEnd),
      monthlyActivityRepo.getMonthlyTowerRanking(q.userId, q.version, monthStart, monthEnd),
      monthlyActivityRepo.getMonthlyDailyTowerData(q.userId, q.version, monthStart, monthEnd),
      monthlyActivityRepo.getMonthlyActivityBreakdownByLastPlayed(
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

    // IIDX Tower未連携のユーザーはtowerStats.playDaysが常に0になるため、
    // スコア更新のあったユニーク日数をフォールバック（両者の大きい方）として使う
    const playDaysFromScoreUpdates = new Set(songUpdateDateMap.values()).size;
    const playDays = Math.max(towerStats.playDays, playDaysFromScoreUpdates);

    return ok({
      ...towerStats,
      playDays,
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
