import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { calculateRadar } from "@/lib/radar/calculator";
import { statsRepo } from "@/lib/db/stats";
import { NextApiRequest, NextApiResponse } from "next";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, version, levels, difficulties } = parseStatsQuery(req.query);

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const scores = await statsRepo.getLatestScoresWithMusicData(
      userId,
      version,
      levels,
      difficulties,
    );

    return res.status(200).json(calculateRadar(scores));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
