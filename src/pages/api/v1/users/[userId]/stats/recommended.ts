import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { recommendedParamsSchema } from "@/schemas/stats/recommended";
import { parseQuery } from "@/services/nextRequest/parseBody";

export default withUserApiHandler(
  (req, res) => {
    const query = parseStatsQuery(req.query, res);
    if (!query) return null;

    const body = parseQuery(recommendedParamsSchema, req.query, res);
    if (!body) return null;

    return { ...query, ...body };
  },
  async (req, res, { userId, version, levels, difficulties, limit, offset }) => {
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

    const sortedWeapons = [...processed].sort(
      (a, b) => b.diff.bpi - a.diff.bpi,
    );
    const sortedPotential = [...processed].sort(
      (a, b) => a.diff.bpi - b.diff.bpi,
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
    });
  },
);
