import { allScoresRepo } from "@/lib/db/allScores";
import { rejectAccess } from "@/middlewares/api/withApi";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId, songId } = req.query;

  if (!userId || !songId) {
    return res.status(400).json({ message: "Parameters are missing." });
  }

  try {
    const access = await checkProfileAccess(req, userId as string);
    if (!access.hasAccess) return rejectAccess(res, access);

    return res
      .status(200)
      .json(allScoresRepo.getScoreHistory(userId as string, songId as string));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
