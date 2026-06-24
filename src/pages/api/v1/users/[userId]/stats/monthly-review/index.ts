import { monthlyReviewRepo } from "@/lib/db/monthly-review";
import { statsRepo } from "@/lib/db/stats";
import dayjs from "@/lib/dayjs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
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
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import type { NextApiRequest, NextApiResponse } from "next";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

export type {
  TopSong,
  TopSongImproved,
  RivalSongHighlight,
  GrowthParticipant,
  RivalBpiGrowthEntry,
  RivalDiff,
  MonthlyArena,
  RadarGrowthEntry,
  MonthlyReviewData,
} from "@/types/stats/monthlyReview";

const L12_DIFFICULTIES = IIDX_DIFFICULTIES;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const userId = req.query.userId as string;
  const version = req.query.version as string;
  const month = req.query.month as string; // YYYY-MM or YYYY (year mode)

  const isYearMode = /^\d{4}$/.test(month);
  const isMonthMode = /^\d{4}-\d{2}$/.test(month);

  const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
  if (!version || !isValidVersion || !month || (!isYearMode && !isMonthMode)) {
    return res.status(400).json({
      message: "Missing or invalid params: version, month (YYYY-MM or YYYY)",
    });
  }

  const granularity: "month" | "year" = isYearMode ? "year" : "month";

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);
    const viewerId = access.user?.userId;
    if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

    const monthStart = isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).format("YYYY-MM-DD");
    const monthEnd = isYearMode
      ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).endOf("month").format("YYYY-MM-DD");

    const [
      scoreBatches,
      towerStats,
      arenaRows,
      towerRanking,
      dailyTowerData,
      totalSongs,
      viewerPreMonthState,
      viewerInMonthHistory,
      breakdownRows,
      allL12SongMeta,
      userCurrentL1112,
      preL1112,
    ] = await Promise.all([
      monthlyReviewRepo.getMonthlyScoreBatches(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyTowerStats(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyArenaStats(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyTowerRanking(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyDailyTowerData(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      statsRepo.getTotalSongCount([12], [...L12_DIFFICULTIES]),
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
        [viewerId],
        version,
        monthStart,
      ),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers(
        [viewerId],
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getMonthlyActivityBreakdownByLastPlayed(
        userId,
        version,
        monthStart,
        monthEnd,
      ),
      monthlyReviewRepo.getAllL12SongMeta(),
      monthlyReviewRepo.getUserCurrentL1112Scores(viewerId, version),
      monthlyReviewRepo.getUserPreMonthL1112Scores(
        viewerId,
        version,
        monthStart,
      ),
    ]);

    const monthlyBatchIds = scoreBatches.map((b) => b.batchId);
    const batchPlayDateMap = new Map(
      scoreBatches.map((b) => [b.batchId, b.playDate]),
    );

    const viewerPreMonthBpiMap = new Map<number, number>();
    for (const s of viewerPreMonthState) {
      viewerPreMonthBpiMap.set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
    }
    const {
      history: bpiHistory,
      bpiStart,
      bpiEnd,
      finalBpiMap: viewerFinalBpiMap,
    } = buildBpiTimeline(
      viewerPreMonthBpiMap,
      viewerInMonthHistory,
      totalSongs,
      isYearMode,
    );
    const bpiDiff = Math.round((bpiEnd - bpiStart) * 100) / 100;

    const userL1112SongIds = userCurrentL1112.map((s) => s.songId);

    const [monthlyScores, rivalL1112Scores] = await Promise.all([
      monthlyReviewRepo.getScoresForBatches(userId, version, monthlyBatchIds),
      userL1112SongIds.length > 0
        ? monthlyReviewRepo.getRivalsCurrentScoresForSongs(
            viewerId,
            version,
            userL1112SongIds,
          )
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
    const allSongIds = Array.from(new Set(latestInMonth.map((s) => s.songId)));

    const [preScores, rankMap] = await Promise.all([
      monthlyReviewRepo.getPreMonthScoresByLastPlayed(
        userId,
        version,
        songIdsUpdated,
        monthStart,
      ),
      monthlyReviewRepo.getBatchSongRanks(userId, version, allSongIds),
    ]);

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

    for (const s of topBpiSongs) s.rank = rankMap.get(s.songId) ?? 0;
    for (const s of topImprovedSongs) s.rank = rankMap.get(s.songId) ?? 0;

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
      viewerPreMonthBpiMap,
      viewerFinalBpiMap,
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
      totalSongs,
      isYearMode,
    );

    const rivalsGrowthRanking = buildGrowthRanking(
      rivals,
      viewerId,
      bpiDiff,
      bpiStart,
    );
    const rivalsGrowthTimeline = buildGrowthTimeline(
      rivals,
      rivalComputedTimeline,
      viewerId,
      bpiHistory,
      bpiStart,
      bpiEnd,
      monthStart,
    );

    const result: MonthlyReviewData = {
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
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("[monthly-review]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
