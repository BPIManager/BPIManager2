import type { NextApiRequest, NextApiResponse } from "next";
import { StatsRepository } from "@/lib/db/stats";
import { latestVersion } from "@/constants/latestVersion";
import { checkUserAccess } from "@/middlewares/api/withApi";

const repository = new StatsRepository();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version = latestVersion, level, difficulty } = req.query;

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const scores = await repository.getLatestScoresWithMusicData(
      userId as string,
      version as string,
    );

    const targetLevels = (
      Array.isArray(level) ? level : level ? [level] : []
    ).map((v) => parseInt(v, 10));
    const targetDiffs = Array.isArray(difficulty)
      ? difficulty
      : difficulty
        ? [difficulty]
        : [];

    const buckets = [-15, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const distribution = buckets.map((val) => ({
      label: val === 100 ? "100+" : val.toString(),
      count: 0,
    }));

    scores.forEach((s) => {
      if (!s.exScore || s.exScore <= 0) return;
      if (
        targetLevels.length > 0 &&
        !targetLevels.includes(s.difficultyLevel as number)
      )
        return;
      if (
        targetDiffs.length > 0 &&
        !targetDiffs.includes(s.difficulty as string)
      )
        return;

      const bpi = s.bpi ?? -15;
      let idx: number;

      if (bpi < -10) idx = 0;
      else if (bpi < 0) idx = 1;
      else if (bpi >= 100) idx = buckets.length - 1;
      else idx = Math.floor(bpi / 10) + 2;

      if (distribution[idx]) distribution[idx].count++;
    });

    return res.status(200).json(distribution);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
