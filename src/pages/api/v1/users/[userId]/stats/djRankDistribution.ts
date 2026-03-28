import type { NextApiRequest, NextApiResponse } from "next";
import { RANK_TABLE } from "@/constants/djRank";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { userId, version, levels, difficulties } = parseStatsQuery(req.query);

  if (levels.length === 0 && difficulties.length === 0) {
    return res.status(400).json({ message: "Required parameters are missing" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const scores = await statsRepo.getLatestScoresWithMusicData(
      userId,
      version,
    );

    const distribution = RANK_TABLE.map((r) => ({ label: r.label, count: 0 }));

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

      const rankIdx = RANK_TABLE.findLastIndex(
        (r) => s.exScore / maxScore >= r.ratio,
      );
      if (rankIdx !== -1) distribution[rankIdx].count++;
    });

    return res.status(200).json(distribution);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
