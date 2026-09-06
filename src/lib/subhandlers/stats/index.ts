import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import fs from "fs/promises";
import path from "path";
import { BpiCalculator } from "@/lib/bpi";
import { calculateRadar } from "@/lib/radar/calculator";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { statsSocialRepo } from "@/lib/db/aggregates/stats/social";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { usersRepo } from "@/lib/db/domains/users";
import { getArenaStatsHistory } from "@/lib/db/domains/arenaHistory";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
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
import type { StatsQuery } from "@/types/stats/query";
import type { IIDXVersion } from "@/types/iidx/version";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import type { ValidStep } from "@/schemas/stats/singleBPIDistribution";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";

/**
 * stats ドメイン（`users/[userId]/stats/**`）の subhandler 群。
 * ルート側でクエリ検証（parseStatsQuery / parseQuery）とアクセス制御
 * （withUserApiHandler）を行い、ここは検証済みクエリを受け取り
 * `HandlerResult` を返す。v1/v2 で共有。
 */

const L12_DIFFICULTIES = IIDX_DIFFICULTIES;

function groupByOf(req: NextApiRequest): StatsGroupBy {
  return (req.query.groupBy as StatsGroupBy) || "day";
}

/** GET stats/activeDates */
export async function handleStatsActiveDates(
  q: { userId: string; version: IIDXVersion },
): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    [12],
  );
  return ok(activity.filter((d) => Number(d.count) > 0).map((d) => d.date));
}

/** GET stats/activity */
export async function handleStatsActivity(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const activity = await statsChartsRepo.getActivityData(
    q.userId,
    q.version,
    q.levels,
    q.difficulties,
  );
  return ok(activity);
}

/** GET stats/areaRank */
export async function handleStatsAreaRank(
  q: { userId: string },
): Promise<HandlerResult<unknown>> {
  const user = await usersRepo.getIidxId(q.userId);
  if (!user) return err(404, "User not found");
  return ok(getUserAreaRank(user.iidxId) ?? null);
}

/** GET stats/arenaHistory */
export async function handleStatsArenaHistory(q: {
  userId: string;
  version: string;
  startDate: Date;
  endDate: Date;
}): Promise<HandlerResult<unknown>> {
  try {
    const rows = await getArenaStatsHistory(
      q.userId,
      q.version,
      q.startDate,
      q.endDate,
    );
    const classOffsets = new Map<string, number>();
    try {
      const distPath = path.join(
        process.cwd(),
        `public/data/info/arena_official/${q.version}/latest.json`,
      );
      const dist = JSON.parse(await fs.readFile(distPath, "utf-8")) as {
        distribution: { rank: string; count: number }[];
      };
      let cumulative = 0;
      for (const { rank: cls, count } of dist.distribution) {
        classOffsets.set(cls, cumulative);
        cumulative += count;
      }
    } catch {}

    const result = rows.map((r) => ({
      fetchedAt: r.fetchedAt,
      arenaClass: r.arenaClass,
      arenaRank: r.arenaRank,
      wins: r.wins,
      a1continue: r.a1continue,
      classRank: r.arenaRank,
      globalRank:
        r.arenaRank !== null
          ? (classOffsets.get(r.arenaClass) ?? 0) + r.arenaRank
          : null,
    }));
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

/** GET stats/available-periods */
export async function handleStatsAvailablePeriods(q: {
  userId: string;
  version: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const months = await monthlyReviewRepo.getAvailableMonths(
      q.userId,
      q.version,
    );
    return ok({ months });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/** GET stats/bpiBoxStats */
export async function handleStatsBpiBoxStats(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  try {
    const groupBy = groupByOf(req);
    const { scores, tower } = await statsChartsRepo.getBpiAndVolumePerDate(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    );

    const groupedTower = new Map<string, number>();
    for (const t of tower) {
      const d = dayjs(t.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");
      const count = Number(t.keyCount) + Number(t.scratchCount);
      groupedTower.set(dateKey, (groupedTower.get(dateKey) || 0) + count);
    }

    const grouped = new Map<
      string,
      { bpiMap: Map<number, number>; notesMap: Map<number, number> }
    >();
    for (const row of scores) {
      const d = dayjs(row.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");
      const current = grouped.get(dateKey) ?? {
        bpiMap: new Map(),
        notesMap: new Map(),
      };
      const songId = Number(row.songId);
      const bpi = Number(row.bpi);
      const notes = Number(row.notes);
      if (!current.bpiMap.has(songId) || current.bpiMap.get(songId)! < bpi) {
        current.bpiMap.set(songId, bpi);
        current.notesMap.set(songId, notes);
      }
      grouped.set(dateKey, current);
    }

    const result = [];
    for (const [date, data] of grouped.entries()) {
      const bpis = Array.from(data.bpiMap.values());
      const sorted = bpis.sort((a, b) => a - b);
      const count = sorted.length;
      const registeredNotes = Array.from(data.notesMap.values()).reduce(
        (a, b) => a + b,
        0,
      );
      const totalPhysicalNotes = groupedTower.get(date) || 0;
      const efficiency =
        totalPhysicalNotes > 0 ? registeredNotes / totalPhysicalNotes : 0;
      const top75 = sorted.slice(Math.floor(count * 0.25));
      const top25 = sorted.slice(Math.floor(count * 0.75));
      result.push({
        date,
        min: sorted[0],
        max: sorted[count - 1],
        median: percentile(sorted, 50),
        p25: percentile(sorted, 25),
        p75: percentile(sorted, 75),
        count,
        totalBpi: BpiCalculator.calculateTotalBPI(sorted, count),
        totalBpiTop75: BpiCalculator.calculateTotalBPI(top75, top75.length),
        totalBpiTop25: BpiCalculator.calculateTotalBPI(top25, top25.length),
        totalPhysicalNotes,
        registeredNotes,
        efficiency: Math.min(efficiency * 100, 100),
      });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

const BPM_BANDS = [
  { label: "200~", min: 200, max: Infinity },
  { label: "180~200", min: 180, max: 200 },
  { label: "160~180", min: 160, max: 180 },
  { label: "140~160", min: 140, max: 160 },
  { label: "120~140", min: 120, max: 140 },
  { label: "~120", min: 0, max: 120 },
] as const;
function getBpmBand(bpm: string | null | undefined): string {
  if (!bpm) return "Soflan";
  if (bpm.includes("-")) return "Soflan";
  const n = parseInt(bpm, 10);
  if (isNaN(n)) return "Soflan";
  for (const band of BPM_BANDS) {
    if (n >= band.min && n < band.max) return band.label;
  }
  return "Soflan";
}

/** GET stats/bpmBpiDistribution */
export async function handleStatsBpmBpiDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const songs = await statsChartsRepo.getSongsWithUserBpiForBpmDistribution(
    q.userId,
    q.version,
    q.levels.length > 0 ? q.levels : undefined,
    q.difficulties.length > 0 ? q.difficulties : undefined,
  );
  const bandLabels = [...BPM_BANDS.map((b) => b.label), "Soflan"];
  const bandBpis = new Map<string, number[]>(
    bandLabels.map((label) => [label, []]),
  );
  const bandTotals = new Map<string, number>(
    bandLabels.map((label) => [label, 0]),
  );
  const bandSongs = new Map<
    string,
    {
      title: string;
      difficulty: string;
      bpi: number;
      exScore: number | null;
      notes: number | null;
    }[]
  >(bandLabels.map((label) => [label, []]));

  for (const song of songs) {
    const band = getBpmBand(song.bpm as string | null | undefined);
    bandTotals.set(band, (bandTotals.get(band) ?? 0) + 1);
    const bpi = song.bpi != null ? Number(song.bpi) : -15;
    bandBpis.get(band)?.push(bpi);
    bandSongs.get(band)?.push({
      title: song.title as string,
      difficulty: song.difficulty as string,
      bpi,
      exScore: song.exScore != null ? Number(song.exScore) : null,
      notes: song.notes != null ? Number(song.notes) : null,
    });
  }

  const result = bandLabels.map((label) => {
    const bpis = bandBpis.get(label) ?? [];
    const total = bandTotals.get(label) ?? 0;
    if (total === 0) return { label, totalBpi: null, songs: [] };
    const sorted = [...bpis].sort((a, b) => b - a);
    const totalBpi = BpiCalculator.calculateTotalBPI(sorted, total);
    return {
      label,
      totalBpi: Math.round(totalBpi * 100) / 100,
      songs: bandSongs.get(label) ?? [],
    };
  });
  return ok(result.filter((r) => r.totalBpi !== null));
}

/** GET stats/djRankDistribution */
export async function handleStatsDjRankDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    q.userId,
    q.version,
  );
  const distribution = RANK_TABLE.map((r) => ({ label: r.label, count: 0 }));
  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (q.levels.length > 0 && !q.levels.includes(s.difficultyLevel as number))
      return;
    if (
      q.difficulties.length > 0 &&
      !q.difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rankIdx = RANK_TABLE.findLastIndex(
      (r) => s.exScore / maxScore >= r.ratio,
    );
    if (rankIdx !== -1) distribution[rankIdx].count++;
  });
  return ok(distribution);
}

type NeighborQuery = StatsQuery & {
  limit: number;
  offset: number;
  n: number;
};

/** GET stats/neighbor-recommended */
export async function handleStatsNeighborRecommended(
  q: NeighborQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, limit, offset, n } = q;
  const userTotalBpi = await statsTablesRepo.getLatestTotalBpi(userId, version);
  const neighborIds = await statsSocialRepo.getNeighborIds(
    userTotalBpi,
    userId,
    version,
    n,
  );
  const scores = await statsSocialRepo.getNeighborScoreComparison(
    userId,
    neighborIds,
    version,
    levels,
    difficulties,
  );

  const processed = scores.map((s) => {
    const userBpi = s.bpi !== null ? Number(s.bpi) : null;
    const neighborAvgBpi =
      s.neighborAvgBpi !== null && s.neighborAvgBpi !== undefined
        ? Number(s.neighborAvgBpi)
        : null;
    const bpiDiff =
      userBpi !== null && neighborAvgBpi !== null
        ? userBpi - neighborAvgBpi
        : userBpi !== null
          ? userBpi - userTotalBpi
          : 0;
    return {
      songId: s.songId,
      title: s.title,
      notes: s.notes,
      bpm: s.bpm,
      difficulty: s.difficulty,
      difficultyLevel: s.difficultyLevel,
      releasedVersion: s.releasedVersion,
      logId: s.logId,
      exScore: s.exScore,
      bpi: userBpi,
      clearState: s.clearState,
      missCount: s.missCount,
      scoreAt: s.lastPlayed,
      wrScore: s.wrScore,
      kaidenAvg: s.kaidenAvg,
      coef: s.coef,
      current: { exScore: s.exScore, bpi: userBpi, clearState: s.clearState },
      diff: { exScore: 0, bpi: bpiDiff },
      exDiff: 0,
      bpiDiff,
      previous: true,
      neighborAvgBpi,
      neighborCount: Number(s.neighborCount ?? 0),
    };
  });
  const withNeighbors = processed.filter((s) => s.neighborCount > 0);
  const sortedWeapons = [...withNeighbors].sort((a, b) => b.bpiDiff - a.bpiDiff);
  const sortedPotential = [...withNeighbors].sort(
    (a, b) => a.bpiDiff - b.bpiDiff,
  );
  return ok({
    weapons: {
      data: sortedWeapons.slice(offset, offset + limit),
      total: sortedWeapons.length,
    },
    potential: {
      data: sortedPotential.slice(offset, offset + limit),
      total: sortedPotential.length,
    },
    usedNeighbors: neighborIds.length,
  });
}

/** GET stats/radar */
export async function handleStatsRadar(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const [scores, validSongKeys] = await Promise.all([
    statsTablesRepo.getLatestScoresWithMusicData(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    ),
    statsTablesRepo.getFilteredSongKeys(q.version, q.levels, q.difficulties),
  ]);
  return ok(calculateRadar(scores, validSongKeys));
}

type RecommendedQuery = StatsQuery & { limit: number; offset: number };

/** GET stats/recommended */
export async function handleStatsRecommended(
  q: RecommendedQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, limit, offset } = q;
  const totalBpi = await statsTablesRepo.getLatestTotalBpi(userId, version);
  const allScores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
    levels,
    difficulties,
  );
  const processed = allScores.map((s) => ({
    songId: s.songId,
    title: s.title,
    notes: s.notes,
    bpm: s.bpm,
    difficulty: s.difficulty,
    difficultyLevel: s.difficultyLevel,
    releasedVersion: s.releasedVersion,
    logId: s.logId,
    exScore: s.exScore,
    bpi: s.bpi,
    clearState: s.clearState,
    missCount: s.missCount,
    scoreAt: s.lastPlayed,
    wrScore: s.wrScore,
    kaidenAvg: s.kaidenAvg,
    coef: s.coef,
    current: { exScore: s.exScore, bpi: s.bpi, clearState: s.clearState },
    diff: { exScore: 0, bpi: Number(s.bpi) - totalBpi },
    exDiff: 0,
    bpiDiff: Number(s.bpi) - totalBpi,
    previous: true,
  }));
  const sortedWeapons = [...processed].sort((a, b) => b.diff.bpi - a.diff.bpi);
  const sortedPotential = [...processed].sort(
    (a, b) => a.diff.bpi - b.diff.bpi,
  );
  return ok({
    weapons: {
      data: sortedWeapons.slice(offset, offset + limit),
      total: sortedWeapons.length,
    },
    potential: {
      data: sortedPotential.slice(offset, offset + limit),
      total: sortedPotential.length,
    },
  });
}

type StepQuery = StatsQuery & { step: ValidStep };

/** GET stats/scoreRateDistribution */
export async function handleStatsScoreRateDistribution(
  q: StepQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, step } = q;
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
  );
  const distribution: { label: string; count: number }[] = [];
  for (let v = 0; v < 100; v += step) {
    distribution.push({ label: v.toString(), count: 0 });
  }
  distribution.push({ label: "100", count: 0 });

  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
      return;
    if (
      difficulties.length > 0 &&
      !difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rate = (s.exScore / maxScore) * 100;
    const idx = Math.min(Math.floor(rate / step), distribution.length - 1);
    if (distribution[idx]) distribution[idx].count++;
  });
  return ok(distribution);
}

/** GET stats/singleBPIDistribution */
export async function handleStatsSingleBpiDistribution(
  q: StepQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, step } = q;
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
  );
  const distribution: { label: string; count: number }[] = [];
  distribution.push({ label: "<-10", count: 0 });
  for (let v = -10; v < 100; v += step) {
    distribution.push({ label: v.toString(), count: 0 });
  }
  distribution.push({ label: "100+", count: 0 });

  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
      return;
    if (
      difficulties.length > 0 &&
      !difficulties.includes(s.difficulty as string)
    )
      return;
    const bpi = s.bpi ?? -15;
    let idx: number;
    if (bpi < -10) {
      idx = 0;
    } else if (bpi >= 100) {
      idx = distribution.length - 1;
    } else {
      idx = Math.floor((bpi - -10) / step) + 1;
    }
    if (distribution[idx]) distribution[idx].count++;
  });
  return ok(distribution);
}

const DIFFICULTY_LABELS: Record<string, string> = {
  HYPER: "[H]",
  ANOTHER: "[A]",
  LEGGENDARIA: "[L]",
};

/** GET stats/totalBPIhistory */
export async function handleStatsTotalBpiHistory(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const groupBy = groupByOf(req);
  const [allLogs, totalSongs] = await Promise.all([
    statsTablesRepo.getScoreHistory(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
    ),
    statsTablesRepo.getTotalSongCount(q.levels, q.difficulties),
  ]);
  if (allLogs.length === 0) return ok([]);

  const toJSTDateStr = (date: Date | string): string =>
    dayjs(date).tz().format("YYYY-MM-DD");

  const logsByDate: Record<string, typeof allLogs> = {};
  allLogs.forEach((log) => {
    if (!log.songId || !log.lastPlayed) return;
    const date = toJSTDateStr(log.lastPlayed);
    if (!logsByDate[date]) logsByDate[date] = [];
    logsByDate[date].push(log);
  });

  const trend = [];
  const latestBpisBySong = new Map<number, number>();
  const latestExScoresBySong = new Map<number, number>();
  const startDate = dayjs(allLogs[0].lastPlayed).tz().startOf("day");
  const endDate = dayjs(allLogs[allLogs.length - 1].lastPlayed)
    .tz()
    .startOf("day");

  for (let d = startDate; !d.isAfter(endDate); d = d.add(1, "day")) {
    const dateStr = d.format("YYYY-MM-DD");
    const updatedOnThisDay = logsByDate[dateStr] || [];
    const updatedSongs = updatedOnThisDay
      .filter((s) => s.songId != null)
      .map((s) => {
        const songId = s.songId as number;
        const suffix = DIFFICULTY_LABELS[s.difficulty as string] || "";
        const prevExScore = latestExScoresBySong.get(songId) ?? null;
        const prevBpi = latestBpisBySong.get(songId) ?? null;
        const newBpi = s.bpi ?? -15;
        latestBpisBySong.set(songId, newBpi);
        latestExScoresBySong.set(songId, s.exScore);
        return {
          title: `${s.title}${suffix}`,
          prevExScore,
          newExScore: s.exScore,
          prevBpi,
          newBpi,
        };
      });
    const allCurrentBpis = Array.from(latestBpisBySong.values());
    const totalBpi = BpiCalculator.calculateTotalBPI(allCurrentBpis, totalSongs);
    trend.push({
      date: dateStr,
      totalBpi,
      count: allCurrentBpis.length,
      updatedSongs,
    });
  }

  if (groupBy === "day") return ok(trend);

  const grouped = new Map<string, (typeof trend)[number]>();
  for (const item of trend) {
    const d = dayjs(item.date);
    let key: string;
    if (groupBy === "month") {
      key = d.format("YYYY-MM");
    } else {
      const dow = d.day();
      const offset = dow === 0 ? -6 : 1 - dow;
      key = d.add(offset, "day").format("YYYY-MM-DD");
    }
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        date: key,
        totalBpi: item.totalBpi,
        count: item.count,
        updatedSongs: [...item.updatedSongs],
      });
    } else {
      existing.totalBpi = item.totalBpi;
      existing.count = item.count;
      existing.updatedSongs.push(...item.updatedSongs);
    }
  }
  return ok(Array.from(grouped.values()));
}

type TotalBpiQuery = { userId: string; version: IIDXVersion; asOf?: string };

/** GET stats/totalBpi */
export async function handleStatsTotalBpi(
  q: TotalBpiQuery,
): Promise<HandlerResult<unknown>> {
  const targetTime =
    !q.asOf || q.asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(q.asOf).endOf("day").utc().toDate();

  const [scores, totalCount, user] = await Promise.all([
    scoreDetailRepo.getScoresWithDetails(q.userId, q.version, {
      targetTime,
      onlyLastPlayedInRange: { start: new Date(0), end: targetTime },
    }),
    statsTablesRepo.getTotalSongCount([12], []),
    usersRepo.getIidxId(q.userId),
  ]);

  const level12Scores = scores.filter((s) => Number(s.difficultyLevel) === 12);
  const bpis = level12Scores.map((s) =>
    s.bpi !== null && s.bpi !== undefined ? Number(s.bpi) : -15,
  );
  const totalBpi = BpiCalculator.calculateTotalBPI(bpis, totalCount);
  const estimatedRank = BpiCalculator.estimateRank(totalBpi);
  const areaRank =
    q.version === latestVersion
      ? getUserAreaRank(user?.iidxId ?? null)
      : null;

  return ok({
    totalBpi,
    estimatedRank,
    playedCount: level12Scores.length,
    totalCount,
    area: areaRank?.area ?? null,
    areaRank: areaRank?.areaRank ?? null,
    totalInArea: areaRank?.totalInArea ?? null,
  });
}

type AaaQuery = {
  userId: string;
  version: IIDXVersion;
  level: number;
  customGoalRatio?: number;
  customGoalOffset?: number;
};

/** GET stats/aaaDifficulty （bare + checkUserAccess はルート側で実施） */
export async function handleStatsAaaDifficulty(
  q: AaaQuery,
): Promise<HandlerResult<unknown>> {
  try {
    const rawData = await statsTablesRepo.getAAATableData(
      q.userId,
      q.version,
      q.level,
    );
    const result = rawData.map((song) => {
      const maxScore = song.notes * 2;
      const aaaTarget = Math.ceil(maxScore * (8 / 9));
      const maxMinusTarget = Math.ceil(maxScore * (17 / 18));
      const songParams = {
        title: song.title,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
        coef: song.coef as number,
      };
      const aaaTargetBpi = BpiCalculator.calc(aaaTarget, songParams) ?? -15;
      const maxMinusTargetBpi =
        BpiCalculator.calc(maxMinusTarget, songParams) ?? -15;
      const customTarget =
        q.customGoalRatio !== undefined
          ? Math.min(
              maxScore,
              Math.max(
                0,
                Math.ceil(maxScore * q.customGoalRatio) +
                  (q.customGoalOffset ?? 0),
              ),
            )
          : undefined;
      const customTargetBpi =
        customTarget !== undefined
          ? (BpiCalculator.calc(customTarget, songParams) ?? -15)
          : undefined;
      const currentExScore = song.userExScore ?? 0;
      const currentBpi = song.userExScore
        ? (BpiCalculator.calc(song.userExScore, songParams) ?? -15)
        : -15;
      return {
        songId: song.songId,
        title: song.title,
        difficulty: song.difficulty,
        notes: song.notes,
        releasedVersion: song.releasedVersion,
        maxScore,
        targets: {
          aaa: {
            exScore: aaaTarget,
            targetBpi: aaaTargetBpi,
            diff: currentExScore - aaaTarget,
          },
          maxMinus: {
            exScore: maxMinusTarget,
            targetBpi: maxMinusTargetBpi,
            diff: currentExScore - maxMinusTarget,
          },
          ...(customTarget !== undefined && customTargetBpi !== undefined
            ? {
                custom: {
                  exScore: customTarget,
                  targetBpi: customTargetBpi,
                  diff: currentExScore - customTarget,
                },
              }
            : {}),
        },
        user: {
          exScore: currentExScore,
          bpi: currentBpi,
          isAaa: currentExScore >= aaaTarget,
          isMaxMinus: currentExScore >= maxMinusTarget,
        },
      };
    });
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

/** GET stats/monthly-review */
export async function handleStatsMonthlyReview(
  q: { userId: string; version: string; month: string },
  access: AccessResult,
): Promise<HandlerResult<unknown>> {
  const owner = q.userId;
  const { version, month } = q;
  const viewerId = access.viewerId;

  try {
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
      monthlyReviewRepo.getMonthlyScoreBatches(owner, version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyTowerStats(owner, version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyArenaStats(owner, version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyTowerRanking(owner, version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyDailyTowerData(owner, version, monthStart, monthEnd),
      statsTablesRepo.getTotalSongCount([12], [...L12_DIFFICULTIES]),
      monthlyReviewRepo.getPreMonthBpiStateForUsers([owner], version, monthStart),
      monthlyReviewRepo.getInMonthScoreHistoryForUsers([owner], version, monthStart, monthEnd),
      monthlyReviewRepo.getMonthlyActivityBreakdownByLastPlayed(owner, version, monthStart, monthEnd),
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
