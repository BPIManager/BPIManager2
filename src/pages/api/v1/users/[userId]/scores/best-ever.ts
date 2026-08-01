import { NextApiRequest, NextApiResponse } from "next";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

async function handleGetBestEver(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { currentVersion, excludeCurrent } = req.query;

  if (!currentVersion || typeof currentVersion !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid currentVersion parameter." });
  }

  const shouldExclude = excludeCurrent === "true";

  const rows = await timelineRepo.getBestEverScores({
    userId,
    currentVersion,
    excludeCurrent: shouldExclude,
  });

  const result = rows.map((row) => ({
    songId: Number(row.songId),
    title: row.title,
    notes: Number(row.notes),
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: Number(row.difficultyLevel),
    releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
    bestExScore: row.bestExScore !== null ? Number(row.bestExScore) : null,
    bestBpi: row.bestBpi !== null ? Number(row.bestBpi) : null,
    bestVersion: row.bestVersion ?? null,
    wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
    kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
    coef: row.coef !== null ? Number(row.coef) : null,
  }));

  return res.status(200).json(result);
}

export default withUserApiHandler(
  (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    return { userId };
  },
  async (req, res, { userId }) => {
    switch (req.method) {
      case "GET":
        return await handleGetBestEver(req, res, userId);
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  },
);
