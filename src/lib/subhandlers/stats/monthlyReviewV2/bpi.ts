import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { resolveMonthlyReviewPeriod, previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { computeOwnerBpiTimeline } from "@/lib/subhandlers/stats/monthlyReviewV2/timeline";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewBpi(q: {
  userId: string;
  version: string;
  month: string;
  compareVersion?: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { granularity, monthStart, monthEnd, useMonthBuckets } =
      resolveMonthlyReviewPeriod(q.month);
    // 全期間モードは期間開始が便宜上の固定値のため「期間開始前のスコア」比較は成立しない。前バージョン（既定）または選択バージョンとの比較に切り替える。
    const compareVersion =
      granularity === "version"
        ? (q.compareVersion ?? previousVersionOf(q.version) ?? undefined)
        : undefined;

    const { history, bpiStart, bpiEnd, bpiDiff } = await computeOwnerBpiTimeline(
      q.userId,
      q.version,
      monthStart,
      monthEnd,
      useMonthBuckets,
      compareVersion,
    );
    return ok({
      start: bpiStart,
      end: bpiEnd,
      diff: bpiDiff,
      history,
      compareVersion: compareVersion ?? null,
    });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
