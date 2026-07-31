import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { statsSocialRepo } from "@/lib/db/aggregates/stats/social";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { neighborRecommendedParamsSchema } from "@/schemas/stats/neighborRecommended";
import { parseQuery } from "@/services/nextRequest/parseBody";

export default withUserApiHandler(
  (req, res) => {
    const query = parseStatsQuery(req.query, res);
    if (!query) return null;

    const body = parseQuery(neighborRecommendedParamsSchema, req.query, res);
    if (!body) return null;

    return { ...query, ...body };
  },
  async (req, res, { userId, version, levels, difficulties, limit, offset, n }) => {
    const userTotalBpi = await statsTablesRepo.getLatestTotalBpi(
      userId,
      version,
    );
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
        current: {
          exScore: s.exScore,
          bpi: userBpi,
          clearState: s.clearState,
        },
        diff: { exScore: 0, bpi: bpiDiff },
        exDiff: 0,
        bpiDiff,
        previous: true,
        neighborAvgBpi,
        neighborCount: Number(s.neighborCount ?? 0),
      };
    });

    // 近傍プレイヤーがその曲をプレイしているもののみを対象にする
    const withNeighbors = processed.filter((s) => s.neighborCount > 0);

    const sortedWeapons = [...withNeighbors].sort(
      (a, b) => b.bpiDiff - a.bpiDiff,
    );
    const sortedPotential = [...withNeighbors].sort(
      (a, b) => a.bpiDiff - b.bpiDiff,
    );

    return res.status(200).json({
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
  },
);
