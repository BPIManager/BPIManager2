import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import dayjs from "@/lib/dayjs";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
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
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";

const L12_DIFFICULTIES = IIDX_DIFFICULTIES;

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }

    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const month = req.query.month as string; // YYYY-MM or YYYY (year mode)

    const isYearMode = /^\d{4}$/.test(month ?? "");
    const isMonthMode = /^\d{4}-\d{2}$/.test(month ?? "");
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(
      version,
    );

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (!version || !isValidVersion || !month || (!isYearMode && !isMonthMode)) {
      res.status(400).json({
        message: "Missing or invalid params: version, month (YYYY-MM or YYYY)",
      });
      return null;
    }

    return { userId, version, month };
  },
  async (_req, res, { userId: owner, version, month }, access) => {
    // owner: URL の [userId] = ページ所有者。全データはこのユーザーのもの。
    // viewerId: 実際の閲覧者(未ログインなら undefined)。ライバル欄で
    // 「所有者が承認しただけの非公開フォロー」を含めてよいかの判定にのみ使う。
    const viewerId = access.viewerId;

    const isYearMode = /^\d{4}$/.test(month);
    const granularity: "month" | "year" = isYearMode ? "year" : "month";

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
      statsTablesRepo.getTotalSongCount([12], [...L12_DIFFICULTIES]),
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

    const ownerPreMonthBpiMap = new Map<number, number>();
    for (const s of ownerPreMonthState) {
      ownerPreMonthBpiMap.set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
    }
    const {
      history: bpiHistory,
      bpiStart,
      bpiEnd,
      finalBpiMap: ownerFinalBpiMap,
    } = buildBpiTimeline(
      ownerPreMonthBpiMap,
      ownerInMonthHistory,
      totalSongs,
      isYearMode,
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
    const allSongIds = Array.from(new Set(latestInMonth.map((s) => s.songId)));

    const [preScores, rankMap] = await Promise.all([
      monthlyReviewRepo.getPreMonthScoresByLastPlayed(
        owner,
        version,
        songIdsUpdated,
        monthStart,
      ),
      monthlyReviewRepo.getBatchSongRanks(owner, version, allSongIds),
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
      ownerPreMonthBpiMap,
      ownerFinalBpiMap,
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

    // 成長ランキング・タイムラインの基準(「本人」行)はページ所有者。
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
  },
  {
    onError: (error, res) => {
      console.error("[monthly-review]", error);
      return res.status(500).json({ message: "Internal Server Error" });
    },
  },
);
