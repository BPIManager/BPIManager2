import dayjs from "@/lib/dayjs";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { buildTopSongs } from "@/lib/monthly-review/topSongs";
import {
  buildActivityBreakdown,
  buildBestDays,
  toPlayDateStr,
} from "@/lib/monthly-review/activity";
import { buildRadarGrowth } from "@/lib/monthly-review/radar";
import { buildArena } from "@/lib/monthly-review/arena";
import {
  buildRivals,
  attachRivalBpiTimelines,
  buildGrowthRanking,
  buildGrowthTimeline,
} from "@/lib/monthly-review/rivals";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReview(
  q: { userId: string; version: string; month: string },
  access: AccessResult,
): Promise<HandlerResult<unknown>> {
  const owner = q.userId;
  const { version, month } = q;
  const viewerId = access.viewerId;

  try {
    const isAllMode = month === "all";
    const isYearMode = !isAllMode && /^\d{4}$/.test(month);
    const granularity: "month" | "year" | "version" = isAllMode
      ? "version"
      : isYearMode
        ? "year"
        : "month";
    // "all"（バージョン全体）は、各クエリが既にversion列でも絞り込んでいることを
    // 利用し、バージョン発売より確実に前の固定日付〜当日を期間として渡すことで
    // 実現する。バージョンごとの稼働開始/終了日を新たに管理する仕組みは追加しない。
    const monthStart = isAllMode
      ? "2000-01-01"
      : isYearMode
        ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
        : dayjs.tz(`${month}-01`).format("YYYY-MM-DD");
    const monthEnd = isAllMode
      ? dayjs.tz().format("YYYY-MM-DD")
      : isYearMode
        ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
        : dayjs.tz(`${month}-01`).endOf("month").format("YYYY-MM-DD");
    // BPI推移の日付バケット化は「月」より粗い粒度（年次・バージョン全体）で
    // まとめて月単位バケットにする
    const useCoarseBuckets = isYearMode || isAllMode;

    const [
      scoreBatches,
      towerStats,
      arenaRows,
      towerRanking,
      dailyTowerData,
      ownerPreMonthState,
      ownerInMonthHistory,
      breakdownRows,
      allL12SongMeta,
      userCurrentL1112,
      preL1112,
    ] = await Promise.all([
      monthlyReviewRepo.getMonthlyScoreBatches(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyTowerStats(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyArenaStats(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyTowerRanking(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyDailyTowerData(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
        [owner],
        version,
        monthStart,
      ),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        [owner],
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyActivityBreakdownByLastPlayed(
        owner,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getAllL12SongMeta(),
      monthlyReviewRepo.getUserCurrentL1112Scores(owner, version),
      monthlyReviewRepo.getUserPreMonthL1112Scores(owner, version, monthStart),
    ]);

    const monthlyBatchIds = scoreBatches.map((b) => b.batchId);
    const batchPlayDateMap = new Map(
      scoreBatches.map((b) => [b.batchId, b.playDate]),
    );
    const ownerPreMonthExScoreMap = new Map<number, number>();
    for (const s of ownerPreMonthState) {
      if (s.exScore != null) ownerPreMonthExScoreMap.set(s.songId, Number(s.exScore));
    }
    const {
      history: bpiHistory,
      bpiStart,
      bpiEnd,
      finalExScoreMap: ownerFinalExScoreMap,
    } = buildBpiTimeline(
      ownerPreMonthExScoreMap,
      ownerInMonthHistory,
      allL12SongMeta,
      useCoarseBuckets,
    );
    const bpiDiff = Math.round((bpiEnd - bpiStart) * 100) / 100;
    const userL1112SongIds = userCurrentL1112.map((s) => s.songId);

    const [monthlyScores, rivalL1112Scores] = await Promise.all([
      monthlyReviewRepo.getScoresForBatches(owner, version, monthlyBatchIds),
      userL1112SongIds.length > 0
        ? monthlyReviewRepo.getRivalsCurrentScoresForSongs({
            ownerId: owner,
            viewerId,
            version,
            songIds: userL1112SongIds,
          })
        : Promise.resolve([]),
    ]);

    const latestInMonthMap = new Map<number, (typeof monthlyScores)[0]>();
    for (const s of monthlyScores) {
      const existing = latestInMonthMap.get(s.songId);
      if (!existing || s.logId > existing.logId) {
        latestInMonthMap.set(s.songId, s);
      }
    }
    const latestInMonth = Array.from(latestInMonthMap.values());
    const songIdsUpdated = latestInMonth.map((s) => s.songId);

    const preScores = await monthlyReviewRepo.getPreMonthScoresByLastPlayed(
      owner,
      version,
      songIdsUpdated,
      monthStart,
    );

    const preScoreMap = new Map<
      number,
      { exScore: number; bpi: number | null }
    >();
    for (const s of preScores) {
      preScoreMap.set(s.songId, {
        exScore: s.exScore,
        bpi: s.bpi != null ? Number(s.bpi) : null,
      });
    }

    const { topBpiSongs, topImprovedSongs } = buildTopSongs(
      latestInMonth,
      preScoreMap,
    );

    const { byDayOfWeek, byHour } = buildActivityBreakdown(breakdownRows);
    const bestDays = buildBestDays(dailyTowerData, bpiHistory, bpiStart);

    const songUpdateDateMap = new Map<number, string>();
    for (const s of latestInMonth) {
      const playDate = s.batchId
        ? (batchPlayDateMap.get(s.batchId as string) ?? null)
        : null;
      if (playDate) songUpdateDateMap.set(s.songId, toPlayDateStr(playDate));
    }

    const radarGrowth = buildRadarGrowth(
      topImprovedSongs,
      allL12SongMeta,
      songUpdateDateMap,
      ownerPreMonthExScoreMap,
      ownerFinalExScoreMap,
    );
    const arena = buildArena(arenaRows);

    const userPreL1112Map = new Map<number, number>();
    for (const s of preL1112) userPreL1112Map.set(s.songId, s.exScore);

    const rivals = buildRivals(
      userCurrentL1112.map((s) => ({
        ...s,
        difficulty: s.difficulty as string,
      })),
      rivalL1112Scores.map((r) => ({
        ...r,
        profileImage: r.profileImage ?? null,
      })),
      userPreL1112Map,
    );

    const [rivalPreMonthState, rivalInMonthHistory] = await Promise.all([
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
        rivals.map((r) => r.userId),
        version,
        monthStart,
      ),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        rivals.map((r) => r.userId),
        version,
        monthStart,
        monthEnd,
      ),
    ]);

    const rivalComputedTimeline = attachRivalBpiTimelines(
      rivals,
      rivalPreMonthState,
      rivalInMonthHistory,
      allL12SongMeta,
      useCoarseBuckets,
    );
    const rivalsGrowthRanking = buildGrowthRanking(
      rivals,
      owner,
      bpiDiff,
      bpiStart,
    );
    const rivalsGrowthTimeline = buildGrowthTimeline(
      rivals,
      rivalComputedTimeline,
      owner,
      bpiHistory,
      bpiStart,
      bpiEnd,
      monthStart,
    );

    return ok({
      month,
      version,
      granularity,
      bpi: { start: bpiStart, end: bpiEnd, diff: bpiDiff, history: bpiHistory },
      topSongs: { topBpiSongs, topImprovedSongs },
      activity: {
        ...towerStats,
        updatedSongs: latestInMonth.length,
        byDayOfWeek,
        byHour,
        towerRanking,
        bestDays,
      },
      rivals,
      rivalsGrowthRanking,
      rivalsGrowthTimeline,
      arena,
      radarGrowth: radarGrowth.length > 0 ? radarGrowth : null,
    });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
