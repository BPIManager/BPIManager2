import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";
import { resolveMonthlyReviewPeriod } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { computeOwnerBpiTimeline } from "@/lib/subhandlers/stats/monthlyReviewV2/timeline";
import type { HandlerResult } from "@/types/api";

/**
 * フッターの「自分の月別のデータを確認する」導線用。データがある全ての月ごとに
 * 総合BPIの開始/終了値を返す（月次まとめページへのリンク先一覧）。
 */
export async function handleStatsMonthlyReviewMonthlySummary(q: {
  userId: string;
  version: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const availableMonths = await monthlyActivityRepo.getAvailableMonths(
      q.userId,
      q.version,
    );
    const allMonths = [...availableMonths]
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort((a, b) => b.localeCompare(a));

    const summaries = await Promise.all(
      allMonths.map(async (month) => {
        const { monthStart, monthEnd, useMonthBuckets } =
          resolveMonthlyReviewPeriod(month);
        const { bpiStart, bpiEnd } = await computeOwnerBpiTimeline(
          q.userId,
          q.version,
          monthStart,
          monthEnd,
          useMonthBuckets,
        );
        return { month, start: bpiStart, end: bpiEnd };
      }),
    );

    return ok({ months: summaries });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
