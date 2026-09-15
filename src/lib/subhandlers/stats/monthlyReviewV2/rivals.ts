import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { db } from "@/lib/db";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import {
  buildRivals,
  attachRivalBpiTimelines,
  buildGrowthRanking,
  buildGrowthTimeline,
} from "@/lib/monthly-review/rivals";
import {
  resolveMonthlyReviewPeriod,
  computeOwnerBpiTimeline,
  recomputeBpiTimelinesForUsers,
  previousVersionOf,
  jstDayStart,
  jstDayEnd,
} from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewRivals(
  q: { userId: string; version: string; month: string },
  access: AccessResult,
): Promise<HandlerResult<unknown>> {
  const owner = q.userId;
  const { version, month } = q;
  const viewerId = access.viewerId;

  try {
    const { granularity, monthStart, monthEnd, useMonthBuckets } =
      resolveMonthlyReviewPeriod(month);
    // 「全期間」モードは期間開始前スコアとの比較が意味を持たないため
    // 前バージョンとの比較に切り替える（top-songs/radar-growthと同じ既定値）
    const compareVersion =
      granularity === "version" ? (previousVersionOf(version) ?? undefined) : undefined;

    const [userCurrentL1112, preL1112, bpiTimeline] = await Promise.all([
      monthlyReviewRepo.getUserCurrentL1112Scores(owner, version),
      monthlyReviewRepo.getUserPreMonthL1112Scores(owner, version, monthStart),
      computeOwnerBpiTimeline(
        owner,
        version,
        monthStart,
        monthEnd,
        useMonthBuckets,
        compareVersion,
      ),
    ]);

    const userL1112SongIds = userCurrentL1112.map((s) => s.songId);
    const rivalL1112Scores =
      userL1112SongIds.length > 0
        ? await monthlyReviewRepo.getRivalsCurrentScoresForSongs({
            ownerId: owner,
            viewerId,
            version,
            songIds: userL1112SongIds,
          })
        : [];

    const userPreL1112Map = new Map<number, number>();
    for (const s of preL1112) userPreL1112Map.set(s.songId, s.exScore);

    const rivals = buildRivals(
      userCurrentL1112.map((s) => ({ ...s, difficulty: s.difficulty as string })),
      rivalL1112Scores.map((r) => ({ ...r, profileImage: r.profileImage ?? null })),
      userPreL1112Map,
    );

    const rivalUserIds = rivals.map((r) => r.userId);
    const startDate = jstDayStart(monthStart);
    const endDate = jstDayEnd(monthEnd);
    const [rivalLogsInRange, rivalBaselineLogs] = await Promise.all([
      userStatusLogsRepo.getLogsInRangeBatch(
        db,
        rivalUserIds,
        version,
        startDate,
        endDate,
      ),
      compareVersion
        ? userStatusLogsRepo.getLatestTotalBpiBatch(db, rivalUserIds, compareVersion)
        : userStatusLogsRepo.getLatestBeforeBatch(db, rivalUserIds, version, startDate),
    ]);

    // userStatusLogsにこの期間のログが1件も無いライバル（バックフィル・遅延同期）
    // のみ、scores.lastPlayed基準の再計算にフォールバックする。対象を絞ることで
    // 再計算コストをフォロー中の少数のライバルに限定する
    const logsCoveredUserIds = new Set(rivalLogsInRange.map((r) => r.userId));
    const baselineCoveredUserIds = new Set(
      rivalBaselineLogs.filter((r) => r.totalBpi != null).map((r) => r.userId),
    );
    const rivalIdsWithoutCoverage = rivalUserIds.filter(
      (uid) => !logsCoveredUserIds.has(uid) && !baselineCoveredUserIds.has(uid),
    );
    const rivalFallbackTimelines = await recomputeBpiTimelinesForUsers(
      rivalIdsWithoutCoverage,
      version,
      monthStart,
      monthEnd,
      useMonthBuckets,
      compareVersion,
    );

    const rivalComputedTimeline = attachRivalBpiTimelines(
      rivals,
      rivalLogsInRange,
      rivalBaselineLogs,
      useMonthBuckets,
      !!compareVersion,
      rivalFallbackTimelines,
    );
    const rivalsGrowthRanking = buildGrowthRanking(
      rivals,
      owner,
      bpiTimeline.bpiDiff,
      bpiTimeline.bpiStart,
    );
    const rivalsGrowthTimeline = buildGrowthTimeline(
      rivals,
      rivalComputedTimeline,
      owner,
      bpiTimeline.history,
      bpiTimeline.bpiStart,
      bpiTimeline.bpiEnd,
      monthStart,
      !!compareVersion,
    );

    return ok({ rivals, rivalsGrowthRanking, rivalsGrowthTimeline });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
