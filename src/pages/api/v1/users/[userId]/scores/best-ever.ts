import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";

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

  const rows = await logsRepo.getBestEverScores({
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET":
        return await handleGetBestEver(req, res, userId);
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
