import { calculateRadar } from "@/lib/radar/calculator";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { statsSocialRepo } from "@/lib/db/aggregates/stats/social";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

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
