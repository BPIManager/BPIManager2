import dayjs from "@/lib/dayjs";
import { LogRepository } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, batchId } = req.query;
  if (!userId || !version || !batchId)
    return res.status(400).json({ message: "Parameters are missing." });

  const uid = String(userId);
  const v = String(version);
  const repo = new LogRepository();

  try {
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const target = await repo.findBatchById(String(batchId));
    if (!target) return res.status(404).json({ message: "Batch not found." });

    const jstDate = dayjs.utc(target.createdAt).tz().format("YYYY-MM-DD");
    const dayRange = repo.getJstRange(jstDate, "day");

    const [nav, sameDay, results] = await Promise.all([
      repo.getBatchNavigation(uid, v, target.createdAt, dayRange),
      repo.findBatchesInRange(uid, v, dayRange.start, dayRange.end),
      repo.getScoresWithDetails(uid, v, { batchIds: [String(batchId)] }),
    ]);

    return res.status(200).json({
      songs: results.map(LogRepository.mapToLogNested),
      pagination: {
        ...nav,
        current: target,
        dailyBatchIds: sameDay.map((b) => b.batchId),
        dailyBatchCount: sameDay.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
