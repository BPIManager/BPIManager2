import { BpiCalculator } from "@/lib/bpi";
import { statsRepo } from "@/lib/db/stats";
import dayjs from "@/lib/dayjs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";
import topElements from "@/constants/radars/topElements.json";
import { ALL_CATEGORIES } from "@/lib/radar/calculator";
import type { RadarCategory } from "@/types/stats/radar";
import type { NextApiRequest, NextApiResponse } from "next";

const L12_DIFFICULTIES = ["HYPER", "ANOTHER", "LEGGENDARIA"] as const;

/**
 * scores テーブルを走査し、BpiCalculator で日ごとに totalBPI を再計算する。
 * totalBPIhistory エンドポイントと同じアプローチ。
 */
function buildBpiTimeline(
  preMonthBpiMap: Map<number, number>,
  inMonthEntries: {
    songId: number;
    bpi: number | null;
    lastPlayed: Date | string;
  }[],
  totalSongs: number,
  isYearMode: boolean,
): {
  history: { date: string; value: number }[];
  bpiStart: number;
  bpiEnd: number;
  finalBpiMap: Map<number, number>;
} {
  const latestBpisBySong = new Map(preMonthBpiMap);

  const bpiStart =
    Math.round(
      BpiCalculator.calculateTotalBPI(
        Array.from(latestBpisBySong.values()),
        totalSongs,
      ) * 100,
    ) / 100;

  // entries は (lastPlayed ASC, logId ASC) 順 → 同日・同曲は後のエントリが勝つ
  const byKey = new Map<string, { songId: number; bpi: number | null }[]>();
  for (const entry of inMonthEntries) {
    const dateStr = dayjs(entry.lastPlayed as Parameters<typeof dayjs>[0])
      .tz()
      .format("YYYY-MM-DD");
    const key = isYearMode ? dateStr.slice(0, 7) : dateStr;
    const arr = byKey.get(key) ?? [];
    arr.push({ songId: entry.songId, bpi: entry.bpi });
    byKey.set(key, arr);
  }

  let currentBpi = bpiStart;
  const historyMap = new Map<string, number>();

  for (const key of Array.from(byKey.keys()).sort()) {
    for (const update of byKey.get(key)!) {
      latestBpisBySong.set(
        update.songId,
        update.bpi != null ? Number(update.bpi) : -15,
      );
    }
    currentBpi =
      Math.round(
        BpiCalculator.calculateTotalBPI(
          Array.from(latestBpisBySong.values()),
          totalSongs,
        ) * 100,
      ) / 100;
    historyMap.set(key, currentBpi);
  }

  const history = Array.from(historyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ date: isYearMode ? `${key}-01` : key, value }));

  return {
    history,
    bpiStart,
    bpiEnd: currentBpi,
    finalBpiMap: new Map(latestBpisBySong),
  };
}

export interface TopSong {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  bpi: number;
}

export interface TopSongImproved extends TopSong {
  bpiBefore: number;
  bpiAfter: number;
  diff: number;
}

export interface RivalSongHighlight {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  userExScore: number;
  rivalExScore: number;
  margin: number;
}

export interface GrowthParticipant {
  userId: string;
  userName: string;
  isViewer: boolean;
  profileImage: string | null;
  bpiBase: number;
  history: { date: string; bpi: number }[];
}

export interface RivalBpiGrowthEntry {
  userId: string;
  userName: string;
  profileImage: string | null;
  isViewer: boolean;
  bpiGrowth: number;
  growthRate: number | null;
}

export interface RivalDiff {
  userId: string;
  userName: string;
  profileImage: string | null;
  newWins: number;
  newLosses: number;
  topWinningSongs: RivalSongHighlight[];
  bpiStart: number | null;
  bpiEnd: number | null;
  bpiGrowth: number | null;
}

export interface MonthlyArena {
  bestClass: string;
  bestRank: number | null;
  maxA1Continue: number | null;
}

export interface RadarGrowthEntry {
  element: string;
  totalDiff: number;
  bpiStart: number;
  bpiEnd: number;
  songs: TopSongImproved[];
  timeline: { date: string; cumDiff: number }[];
}

export interface MonthlyReviewData {
  month: string;
  version: string;
  granularity: "month" | "year";
  bpi: {
    start: number;
    end: number;
    diff: number;
    history: { date: string; value: number }[];
  };
  topSongs: {
    topBpiSongs: TopSong[];
    topImprovedSongs: TopSongImproved[];
  };
  activity: {
    totalKeys: number;
    totalScratches: number;
    playDays: number;
    updatedSongs: number;
    byDayOfWeek: { day: number; count: number }[];
    byHour: { hour: number; count: number }[];
    towerRanking: {
      keysRank: number;
      scratchRank: number;
      totalUsers: number;
    } | null;
    bestDays: {
      bestGrowthDay: { date: string; bpiDiff: number } | null;
      bestKeysDay: { date: string; keyCount: number } | null;
      bestScratchDay: { date: string; scratchCount: number } | null;
    } | null;
  };
  rivals: RivalDiff[];
  rivalsGrowthRanking: {
    byAbsGrowth: RivalBpiGrowthEntry[];
    byGrowthRate: RivalBpiGrowthEntry[];
  } | null;
  rivalsGrowthTimeline: GrowthParticipant[] | null;
  arena: MonthlyArena | null;
  radarGrowth: RadarGrowthEntry[] | null;
}

const topElementMapForMonthly = new Map<string, RadarCategory>(
  (
    topElements as { title: string; difficulty: string; top: RadarCategory }[]
  ).map((e) => [`${e.title}___${e.difficulty}`, e.top]),
);

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

  if (!version || !month || (!isYearMode && !isMonthMode)) {
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
    ] = await Promise.all([
      statsRepo.getMonthlyScoreBatches(userId, version, monthStart, monthEnd),
      statsRepo.getMonthlyTowerStats(userId, version, monthStart, monthEnd),
      statsRepo.getMonthlyArenaStats(userId, version, monthStart, monthEnd),
      statsRepo.getMonthlyTowerRanking(userId, version, monthStart, monthEnd),
      statsRepo.getMonthlyDailyTowerData(userId, version, monthStart, monthEnd),
      statsRepo.getTotalSongCount([12], [...L12_DIFFICULTIES]),
      statsRepo.getPreMonthBpiStateForUsers([viewerId], version, monthStart),
      statsRepo.getInMonthScoreHistoryForUsers(
        [viewerId],
        version,
        monthStart,
        monthEnd,
      ),
    ]);

    const monthlyBatchIds = scoreBatches.map((b) => b.batchId);
    // playDate: そのバッチの最終lastPlayed (string) — レーダー成長タイムラインで使用
    const batchPlayDateMap = new Map(
      scoreBatches.map((b) => [b.batchId, b.playDate]),
    );

    // scores + BpiCalculator でBPI履歴を再計算（totalBPIhistory と同じアプローチ）
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

    const monthlyScores = await statsRepo.getScoresForBatches(
      userId,
      version,
      monthlyBatchIds,
    );

    // Latest score per song within the month
    const latestInMonthMap = new Map<number, (typeof monthlyScores)[0]>();
    for (const s of monthlyScores) {
      const existing = latestInMonthMap.get(s.songId);
      if (!existing || s.logId > existing.logId) {
        latestInMonthMap.set(s.songId, s);
      }
    }
    const latestInMonth = Array.from(latestInMonthMap.values());
    const songIdsUpdated = latestInMonth.map((s) => s.songId);

    // Pre-month scores: lastPlayed < monthStart の最新スコアをsongIdごとに取得
    const preScoreMap = new Map<
      number,
      { exScore: number; bpi: number | null }
    >();
    const preScores = await statsRepo.getPreMonthScoresByLastPlayed(
      userId,
      version,
      songIdsUpdated,
      monthStart,
    );
    for (const s of preScores) {
      preScoreMap.set(s.songId, {
        exScore: s.exScore,
        bpi: s.bpi != null ? Number(s.bpi) : null,
      });
    }

    // Top songs — build ranked arrays
    const topBpiSongs: TopSong[] = [];
    const topImprovedSongs: TopSongImproved[] = [];

    for (const s of latestInMonth) {
      const bpi = s.bpi != null ? Number(s.bpi) : null;
      if (bpi == null) continue;
      topBpiSongs.push({
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty as string,
        difficultyLevel: s.difficultyLevel,
        bpi,
      });
      const pre = preScoreMap.get(s.songId);
      if (pre != null) {
        const bpiBefore = pre.bpi ?? -15;
        topImprovedSongs.push({
          songId: s.songId,
          title: s.title,
          difficulty: s.difficulty as string,
          difficultyLevel: s.difficultyLevel,
          bpi,
          bpiBefore,
          bpiAfter: bpi,
          diff: bpi - bpiBefore,
        });
      }
    }
    topBpiSongs.sort((a, b) => b.bpi - a.bpi);
    topImprovedSongs.sort((a, b) => b.diff - a.diff);

    // Activity breakdown by day-of-week and hour (lastPlayed基準)
    const breakdownRows =
      await statsRepo.getMonthlyActivityBreakdownByLastPlayed(
        userId,
        version,
        monthStart,
        monthEnd,
      );
    // MySQL DAYOFWEEK: 1=Sun…7=Sat → convert to 0=Mon…6=Sun
    const dowMap = new Map<number, number>();
    const hourMap = new Map<number, number>();
    for (const row of breakdownRows) {
      const mysqlDow = Number(row.dow);
      const appDow = mysqlDow === 1 ? 6 : mysqlDow - 2;
      dowMap.set(appDow, (dowMap.get(appDow) ?? 0) + Number(row.count));
      const h = Number(row.hour);
      hourMap.set(h, (hourMap.get(h) ?? 0) + Number(row.count));
    }
    const byDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
      day: i,
      count: dowMap.get(i) ?? 0,
    }));
    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourMap.get(h) ?? 0,
    }));

    // Best days
    const bestKeysDay =
      dailyTowerData.length > 0
        ? dailyTowerData.reduce((best, d) =>
            Number(d.keyCount) > Number(best.keyCount) ? d : best,
          )
        : null;
    const bestScratchDay =
      dailyTowerData.length > 0
        ? dailyTowerData.reduce((best, d) =>
            Number(d.scratchCount) > Number(best.scratchCount) ? d : best,
          )
        : null;

    let bestGrowthDay: { date: string; bpiDiff: number } | null = null;
    let prevBpi = bpiStart;
    for (const h of bpiHistory) {
      const diff = Math.round((h.value - prevBpi) * 100) / 100;
      if (
        diff > 0 &&
        (bestGrowthDay === null || diff > bestGrowthDay.bpiDiff)
      ) {
        bestGrowthDay = { date: h.date, bpiDiff: diff };
      }
      prevBpi = h.value;
    }

    const toPlayDateStr = (val: unknown): string => {
      if (val instanceof Date) return dayjs(val).format("YYYY-MM-DD");
      if (typeof val === "string") return val.slice(0, 10);
      return "1970-01-01";
    };

    const bestDays = {
      bestGrowthDay,
      bestKeysDay: bestKeysDay
        ? {
            date: toPlayDateStr(bestKeysDay.playDate),
            keyCount: Number(bestKeysDay.keyCount),
          }
        : null,
      bestScratchDay: bestScratchDay
        ? {
            date: toPlayDateStr(bestScratchDay.playDate),
            scratchCount: Number(bestScratchDay.scratchCount),
          }
        : null,
    };

    // Radar growth: group improved songs by radar element
    const songUpdateDateMap = new Map<number, string>();
    for (const s of latestInMonth) {
      const playDate = s.batchId
        ? (batchPlayDateMap.get(s.batchId as string) ?? null)
        : null;
      if (playDate) songUpdateDateMap.set(s.songId, toPlayDateStr(playDate));
    }

    const elementSongsMap = new Map<string, TopSongImproved[]>();
    ALL_CATEGORIES.forEach((cat) => elementSongsMap.set(cat, []));

    for (const song of topImprovedSongs) {
      if (song.diff <= 0 || song.difficultyLevel !== 12) continue;
      const key = `${song.title}___${song.difficulty}`;
      const cat = topElementMapForMonthly.get(key);
      if (cat) elementSongsMap.get(cat)!.push(song);
    }

    const allL12SongMeta = await statsRepo.getAllL12SongMeta();
    const elementSongIdsMap = new Map<string, number[]>();
    ALL_CATEGORIES.forEach((cat) => elementSongIdsMap.set(cat, []));
    for (const s of allL12SongMeta) {
      const key = `${s.title}___${s.difficulty}`;
      const cat = topElementMapForMonthly.get(key);
      if (cat) elementSongIdsMap.get(cat)!.push(s.songId);
    }

    const radarGrowth: RadarGrowthEntry[] = [];
    for (const element of ALL_CATEGORIES) {
      const songs = elementSongsMap.get(element) ?? [];
      const elementSongIds = elementSongIdsMap.get(element) ?? [];
      if (elementSongIds.length === 0) continue;

      const elementSongCount = elementSongIds.length;
      const startBpis = elementSongIds.map(
        (id) => viewerPreMonthBpiMap.get(id) ?? -15,
      );
      const endBpis = elementSongIds.map(
        (id) =>
          viewerFinalBpiMap.get(id) ?? viewerPreMonthBpiMap.get(id) ?? -15,
      );
      const elementBpiStart =
        Math.round(
          BpiCalculator.calculateTotalBPI(startBpis, elementSongCount) * 100,
        ) / 100;
      const elementBpiEnd =
        Math.round(
          BpiCalculator.calculateTotalBPI(endBpis, elementSongCount) * 100,
        ) / 100;
      const totalDiff =
        Math.round((elementBpiEnd - elementBpiStart) * 100) / 100;

      const dailyDiffMap = new Map<string, number>();
      for (const song of songs) {
        const date = songUpdateDateMap.get(song.songId);
        if (date)
          dailyDiffMap.set(date, (dailyDiffMap.get(date) ?? 0) + song.diff);
      }
      const sortedDates = Array.from(dailyDiffMap.keys()).sort();
      let cumDiff = 0;
      const timeline: { date: string; cumDiff: number }[] = [];
      for (const date of sortedDates) {
        cumDiff += dailyDiffMap.get(date) ?? 0;
        timeline.push({ date, cumDiff: Math.round(cumDiff * 100) / 100 });
      }

      radarGrowth.push({
        element,
        totalDiff,
        bpiStart: elementBpiStart,
        bpiEnd: elementBpiEnd,
        songs,
        timeline,
      });
    }

    // Arena stats
    let arena: MonthlyArena | null = null;
    if (arenaRows.length > 0) {
      const order = ARENA_RANK_ORDER as readonly string[];
      let bestClassIdx = Infinity;
      let bestClass = arenaRows[0].arenaClass;
      let bestRank: number | null = null;
      let maxA1Continue: number | null = null;

      for (const row of arenaRows) {
        const idx = order.indexOf(row.arenaClass);
        if (idx < bestClassIdx) {
          bestClassIdx = idx;
          bestClass = row.arenaClass;
          bestRank = row.arenaRank;
        }
        const a1c = row.a1continue != null ? Number(row.a1continue) : null;
        if (a1c != null && (maxA1Continue == null || a1c > maxA1Continue)) {
          maxA1Continue = a1c;
        }
      }
      arena = { bestClass, bestRank, maxA1Continue };
    }

    // Rivals: full L11/L12 comparison — current state vs pre-month state
    const rivals: RivalDiff[] = [];

    const userCurrentL1112 = await statsRepo.getUserCurrentL1112Scores(
      viewerId,
      version,
    );
    const userL1112SongIds = userCurrentL1112.map((s) => s.songId);
    const rivalL1112Scores =
      userL1112SongIds.length > 0
        ? await statsRepo.getRivalsCurrentScoresForSongs(
            viewerId,
            version,
            userL1112SongIds,
          )
        : [];

    const userCurrentMap = new Map<
      number,
      {
        exScore: number;
        title: string;
        difficulty: string;
        difficultyLevel: number;
      }
    >();
    for (const s of userCurrentL1112) {
      userCurrentMap.set(s.songId, {
        exScore: s.exScore,
        title: s.title,
        difficulty: s.difficulty as string,
        difficultyLevel: s.difficultyLevel,
      });
    }

    const userPreL1112Map = new Map<number, number>();
    const preL1112 = await statsRepo.getUserPreMonthL1112Scores(
      viewerId,
      version,
      monthStart,
    );
    for (const s of preL1112) {
      userPreL1112Map.set(s.songId, s.exScore);
    }

    const rivalMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        profileImage: string | null;
        songScores: Map<number, number>;
      }
    >();
    for (const r of rivalL1112Scores) {
      if (!rivalMap.has(r.userId)) {
        rivalMap.set(r.userId, {
          userId: r.userId,
          userName: r.userName,
          profileImage: r.profileImage ?? null,
          songScores: new Map(),
        });
      }
      rivalMap.get(r.userId)!.songScores.set(r.songId, r.exScore);
    }

    for (const rival of rivalMap.values()) {
      let newWins = 0;
      let newLosses = 0;
      const winningSongs: RivalSongHighlight[] = [];

      for (const [songId, rivalEx] of rival.songScores) {
        const userCurrent = userCurrentMap.get(songId);
        if (!userCurrent) continue;

        const userCurrentEx = userCurrent.exScore;

        if (userPreL1112Map.has(songId)) {
          const userPreEx = userPreL1112Map.get(songId)!;
          const wasWinning = userPreEx > rivalEx;
          const isWinning = userCurrentEx > rivalEx;
          if (!wasWinning && isWinning) newWins++;
          if (wasWinning && !isWinning) newLosses++;
        }

        const isWinning = userCurrentEx > rivalEx;

        if (isWinning) {
          winningSongs.push({
            songId,
            title: userCurrent.title,
            difficulty: userCurrent.difficulty,
            difficultyLevel: userCurrent.difficultyLevel,
            userExScore: userCurrentEx,
            rivalExScore: rivalEx,
            margin: userCurrentEx - rivalEx,
          });
        }
      }

      winningSongs.sort((a, b) => b.margin - a.margin);

      if (newWins > 0 || newLosses > 0 || winningSongs.length > 0) {
        rivals.push({
          userId: rival.userId,
          userName: rival.userName,
          profileImage: rival.profileImage,
          newWins,
          newLosses,
          topWinningSongs: winningSongs,
          bpiStart: null,
          bpiEnd: null,
          bpiGrowth: null,
        });
      }
    }
    rivals.sort((a, b) => b.newWins - b.newLosses - (a.newWins - a.newLosses));

    const rivalIds = rivals.map((r) => r.userId);
    const [rivalPreMonthState, rivalInMonthHistory] = await Promise.all([
      statsRepo.getPreMonthBpiStateForUsers(rivalIds, version, monthStart),
      statsRepo.getInMonthScoreHistoryForUsers(
        rivalIds,
        version,
        monthStart,
        monthEnd,
      ),
    ]);

    // userId ごとに pre-month / in-month を仕分け
    const rivalPreMonthByUser = new Map<string, Map<number, number>>();
    for (const s of rivalPreMonthState) {
      if (!rivalPreMonthByUser.has(s.userId))
        rivalPreMonthByUser.set(s.userId, new Map());
      rivalPreMonthByUser
        .get(s.userId)!
        .set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
    }
    const rivalInMonthByUser = new Map<string, typeof rivalInMonthHistory>();
    for (const e of rivalInMonthHistory) {
      const arr = rivalInMonthByUser.get(e.userId) ?? [];
      arr.push(e);
      rivalInMonthByUser.set(e.userId, arr);
    }

    // BpiCalculator でライバルごとのBPIタイムラインを再計算
    const rivalComputedTimeline = new Map<
      string,
      { date: string; value: number }[]
    >();
    for (const r of rivals) {
      const preMap =
        rivalPreMonthByUser.get(r.userId) ?? new Map<number, number>();
      const inMonth = rivalInMonthByUser.get(r.userId) ?? [];
      const {
        history,
        bpiStart: rBpiStart,
        bpiEnd: rBpiEnd,
      } = buildBpiTimeline(preMap, inMonth, totalSongs, isYearMode);
      r.bpiStart = rBpiStart;
      r.bpiEnd = rBpiEnd;
      r.bpiGrowth = Math.round((rBpiEnd - rBpiStart) * 100) / 100;
      rivalComputedTimeline.set(r.userId, history);
    }

    const growthEntries: RivalBpiGrowthEntry[] = [];

    const viewerGrowth = bpiDiff;
    const viewerGrowthRate =
      bpiStart > -15
        ? Math.round((viewerGrowth / (bpiStart + 15)) * 10000) / 100
        : null;
    growthEntries.push({
      userId: viewerId,
      userName: "あなた",
      profileImage: null,
      isViewer: true,
      bpiGrowth: viewerGrowth,
      growthRate: viewerGrowthRate,
    });

    for (const r of rivals) {
      if (r.bpiGrowth !== null && r.bpiStart !== null) {
        const growthRate =
          r.bpiStart > -15
            ? Math.round((r.bpiGrowth / (r.bpiStart + 15)) * 10000) / 100
            : null;
        growthEntries.push({
          userId: r.userId,
          userName: r.userName,
          profileImage: r.profileImage,
          isViewer: false,
          bpiGrowth: r.bpiGrowth,
          growthRate,
        });
      }
    }

    const rivalsGrowthRanking =
      growthEntries.length > 0
        ? {
            byAbsGrowth: [...growthEntries].sort(
              (a, b) => b.bpiGrowth - a.bpiGrowth,
            ),
            byGrowthRate: [...growthEntries]
              .filter((e) => e.growthRate !== null)
              .sort((a, b) => (b.growthRate ?? 0) - (a.growthRate ?? 0)),
          }
        : null;

    const rivalsGrowthTimeline: GrowthParticipant[] = [];
    if (bpiHistory.length > 0 || bpiStart !== bpiEnd) {
      const viewerHistory = bpiHistory.map((h) => ({
        date: h.date,
        bpi: h.value,
      }));
      if (viewerHistory[0]?.date !== monthStart) {
        viewerHistory.unshift({ date: monthStart, bpi: bpiStart });
      }
      rivalsGrowthTimeline.push({
        userId: viewerId,
        userName: "あなた",
        isViewer: true,
        profileImage: null,
        bpiBase: bpiStart,
        history: viewerHistory,
      });
    }

    for (const r of rivals) {
      const rawHistory = rivalComputedTimeline.get(r.userId) ?? [];
      const history: { date: string; bpi: number }[] = rawHistory.map((h) => ({
        date: h.date,
        bpi: h.value,
      }));
      const base = r.bpiStart ?? history[0]?.bpi ?? 0;
      if (history[0]?.date !== monthStart) {
        history.unshift({ date: monthStart, bpi: base });
      }
      rivalsGrowthTimeline.push({
        userId: r.userId,
        userName: r.userName,
        isViewer: false,
        profileImage: r.profileImage,
        bpiBase: base,
        history,
      });
    }

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
      rivalsGrowthTimeline:
        rivalsGrowthTimeline.length > 0 ? rivalsGrowthTimeline : null,
      arena,
      radarGrowth: radarGrowth.length > 0 ? radarGrowth : null,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("[monthly-review]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
