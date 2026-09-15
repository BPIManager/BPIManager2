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
  compareVersion?: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { granularity, monthStart, monthEnd, useMonthBuckets } =
      resolveMonthlyReviewPeriod(q.month);
    // top-songsと同様、「全期間」モードでは期間開始前スコアとの比較が
    // 意味を持たないため前バージョン（既定、config UIから変更可）との比較に切り替える
    const compareVersion =
      granularity === "version"
        ? (q.compareVersion ?? previousVersionOf(q.version) ?? undefined)
        : undefined;

    const [{ latestInMonth, songUpdateDateMap }, bpiTimeline] = await Promise.all([
      computeOwnerMonthlyScores(q.userId, q.version, monthStart, monthEnd),
      computeOwnerBpiTimeline(
        q.userId,
        q.version,
        monthStart,
        monthEnd,
        useMonthBuckets,
        compareVersion,
      ),
    ]);
    const { topBpiSongs, topImprovedSongs } = await computeOwnerTopSongs(
      q.userId,
      q.version,
      monthStart,
      latestInMonth,
      compareVersion,
    );
    // 比較先バージョンにそのユーザーのデータが無い場合、伸び幅の代わりに
    // BPI降順の単純なランキングにフォールバックする
    const usingFallbackComparison = topImprovedSongs.length === 0 && topBpiSongs.length > 0;
    const radarGrowth = buildRadarGrowth(
      topImprovedSongs,
      bpiTimeline.allL12SongMeta,
      songUpdateDateMap,
      bpiTimeline.ownerPreMonthExScoreMap,
      bpiTimeline.finalExScoreMap,
      topBpiSongs,
    );
    return ok({
      radarGrowth: radarGrowth.length > 0 ? radarGrowth : null,
      compareVersion: compareVersion ?? null,
      usingFallbackComparison,
    });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
