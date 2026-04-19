import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { parseBody } from "@/services/nextRequest/parseBody";
import { batchesQuerySchema } from "@/schemas/batches/query";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const query = parseBody(batchesQuerySchema, req.query, res);
  if (!query) return;

  const { userId, version, groupedBy, topN } = query;

  const access = await checkUserAccess(req, userId);
  if (!access.hasAccess) return rejectAccess(res, access);

  if (groupedBy === "lastPlayed") {
    const [history, totalSongs12] = await Promise.all([
      statsRepo.getScoreHistory(userId, version, [], []),
      statsRepo.getTotalSongCount([12], []),
    ]);
    const timeline = calculateTotalBpi(history, totalSongs12, version, topN);
    return res.status(200).json(timeline);
  } else {
    const timeline = await logsRepo.getTimelineByBatches({
      userId,
      version,
      topN,
    });
    return res.status(200).json(timeline);
  }
}
