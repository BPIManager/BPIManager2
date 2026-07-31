import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { calculateRadar } from "@/lib/radar/calculator";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { NextApiRequest, NextApiResponse } from "next";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const query = parseStatsQuery(req.query, res);
  if (!query) return;
  const { userId, version, levels, difficulties } = query;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const [scores, validSongKeys] = await Promise.all([
      statsTablesRepo.getLatestScoresWithMusicData(
        userId,
        version,
        levels,
        difficulties,
      ),
      statsTablesRepo.getFilteredSongKeys(version, levels, difficulties),
    ]);

    return res.status(200).json(calculateRadar(scores, validSongKeys));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
