import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, levels, difficulties } = parseStatsQuery(req.query);
  const limit = parseInt(String(req.query.limit ?? "10"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const totalBpi = await statsRepo.getLatestTotalBpi(userId, version);

    const allScores = await statsRepo.getLatestScoresWithMusicData(
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
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
