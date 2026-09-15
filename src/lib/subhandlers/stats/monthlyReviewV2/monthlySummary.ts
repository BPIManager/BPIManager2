import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { resolveMonthlyReviewPeriod, computeOwnerBpiTimeline } from "./_shared";
import type { HandlerResult } from "@/types/api";

const RECENT_MONTHS_LIMIT = 6;

/**
 * フッターの「自分の月別のデータを確認する」導線用。直近N件の月ごとに
 * 総合BPIの開始/終了値を返す（月次まとめページへのリンク先一覧）。
 */
export async function handleStatsMonthlyReviewMonthlySummary(q: {
  userId: string;
  version: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const availableMonths = await monthlyReviewRepo.getAvailableMonths(
      q.userId,
      q.version,
    );
    const recentMonths = [...availableMonths]
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, RECENT_MONTHS_LIMIT);

    const summaries = await Promise.all(
      recentMonths.map(async (month) => {
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
