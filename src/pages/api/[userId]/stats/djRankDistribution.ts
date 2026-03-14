import type { NextApiRequest, NextApiResponse } from "next";
import { RANK_TABLE } from "@/constants/djRank";
import { latestVersion } from "@/constants/latestVersion";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version = latestVersion, level, difficulty } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const scores = await statsRepo.getLatestScoresWithMusicData(
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

    const createEmptyDist = () =>
      RANK_TABLE.map((r) => ({
        label: r.label,
        count: 0,
      }));

    if (targetLevels.length > 0 || targetDiffs.length > 0) {
      const distribution = createEmptyDist();

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

        const maxScore = (s.notes || 0) * 2;
        if (maxScore === 0) return;

        const percentage = s.exScore / maxScore;
        const rankIdx = RANK_TABLE.findLastIndex((r) => percentage >= r.ratio);

        if (rankIdx !== -1) {
          distribution[rankIdx].count++;
        }
      });

      return res.status(200).json(distribution);
    }

    return res.status(404).json({
      message: "Required parameters are missing",
    });
  } catch (error: any) {
    console.error("DJ Rank Distribution Error:", error);
    return res.status(500).json({ message: error.message });
  }
}
