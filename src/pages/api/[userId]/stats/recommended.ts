import { latestVersion } from "@/constants/latestVersion";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    userId,
    version = latestVersion,
    level,
    difficulty,
    limit = "10",
    offset = "0",
  } = req.query;

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess)
      return res.status(403).json({ message: "Access Denied" });

    const targetLevels = level
      ? (Array.isArray(level) ? level : [level]).map((v) => parseInt(v, 10))
      : [];
    const targetDiffs = difficulty
      ? Array.isArray(difficulty)
        ? difficulty
        : [difficulty]
      : [];

    const totalBpi = await statsRepo.getLatestTotalBpi(
      userId as string,
      version as string,
    );

    const allScores = await statsRepo.getLatestScoresWithMusicData(
      userId as string,
      version as string,
      targetLevels,
      targetDiffs,
    );

    const L = parseInt(limit as string, 10);
    const O = parseInt(offset as string, 10);
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
        data: sortedWeapons.slice(O, O + L),
        total: sortedWeapons.length,
      },
      potential: {
        data: sortedPotential.slice(O, O + L),
        total: sortedPotential.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
