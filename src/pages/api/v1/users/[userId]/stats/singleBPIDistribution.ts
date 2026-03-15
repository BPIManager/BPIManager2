import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, levels, difficulties } = parseStatsQuery(req.query);

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const scores = await statsRepo.getLatestScoresWithMusicData(
      userId,
      version,
    );

    const buckets = [-15, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const distribution = buckets.map((val) => ({
      label: val === 100 ? "100+" : val.toString(),
      count: 0,
    }));

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
