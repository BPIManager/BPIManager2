import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  computeOwnerMonthlyScores,
  computeOwnerTopSongs,
  previousVersionOf,
} from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewRadarGrowth(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { granularity, monthStart, monthEnd, useMonthBuckets } =
      resolveMonthlyReviewPeriod(q.month);
    // top-songsと同様、「全期間」モードでは期間開始前スコアとの比較が
    // 意味を持たないため前バージョンとの比較に切り替える（設定UIは無く既定値のみ）
    const compareVersion =
      granularity === "version" ? (previousVersionOf(q.version) ?? undefined) : undefined;

    const [{ latestInMonth, songUpdateDateMap }, bpiTimeline] = await Promise.all([
      computeOwnerMonthlyScores(q.userId, q.version, monthStart, monthEnd),
      computeOwnerBpiTimeline(q.userId, q.version, monthStart, monthEnd, useMonthBuckets),
    ]);
    const { topImprovedSongs } = await computeOwnerTopSongs(
      q.userId,
      q.version,
      monthStart,
      latestInMonth,
      compareVersion,
    );
    const radarGrowth = buildRadarGrowth(
      topImprovedSongs,
      bpiTimeline.allL12SongMeta,
      songUpdateDateMap,
      bpiTimeline.ownerPreMonthExScoreMap,
      bpiTimeline.finalExScoreMap,
    );
    return ok({ radarGrowth: radarGrowth.length > 0 ? radarGrowth : null });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
