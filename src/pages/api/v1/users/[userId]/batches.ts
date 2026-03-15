import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { statsRepo } from "@/lib/db/stats";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, groupedBy, topN = 5 } = req.query;

  if (groupedBy === "lastPlayed") {
    const [history, totalSongs12] = await Promise.all([
      statsRepo.getScoreHistory(userId as string, version as string, [], []),
      statsRepo.getTotalSongCount([12], []),
    ]);
    const timeline = calculateTotalBpi(
      history,
      totalSongs12,
      version as string,
      Number(topN),
    );
    return res.status(200).json(timeline);
  } else {
    const timeline = await logsRepo.getTimelineByBatches({
      userId: userId as string,
      version: version as string,
      topN: Number(topN),
    });
    return res.status(200).json(timeline);
  }
}
