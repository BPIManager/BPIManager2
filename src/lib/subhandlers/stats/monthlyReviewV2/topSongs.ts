import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { resolveMonthlyReviewPeriod, previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { computeOwnerMonthlyScores, computeOwnerTopSongs } from "@/lib/subhandlers/stats/monthlyReviewV2/scores";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewTopSongs(q: {
  userId: string;
  version: string;
  month: string;
  compareVersion?: string;
  excludeNewPlays?: boolean;
}): Promise<HandlerResult<unknown>> {
  try {
    const { granularity, monthStart, monthEnd } = resolveMonthlyReviewPeriod(
      q.month,
    );
    // 全期間モードは期間開始が便宜上の固定値のため「期間開始前のスコア」比較は成立しない。前バージョン（既定）または選択バージョンとの比較に切り替える。
    const compareVersion =
      granularity === "version"
        ? (q.compareVersion ?? previousVersionOf(q.version) ?? undefined)
        : undefined;

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
      compareVersion,
      q.excludeNewPlays ?? false,
    );
    return ok({ topBpiSongs, topImprovedSongs, compareVersion: compareVersion ?? null });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
