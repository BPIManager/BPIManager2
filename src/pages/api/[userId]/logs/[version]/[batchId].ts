import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
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

  try {
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const target = await logsRepo.findBatchById(String(batchId));
    if (!target) return res.status(404).json({ message: "Batch not found." });

    const jstDate = dayjs.utc(target.createdAt).tz().format("YYYY-MM-DD");
    const dayRange = logsRepo.getJstRange(jstDate, "day");

    const [nav, sameDay, results] = await Promise.all([
      logsRepo.getBatchNavigation(uid, v, target.createdAt, dayRange),
      logsRepo.findBatchesInRange(uid, v, dayRange.start, dayRange.end),
      logsRepo.getScoresWithDetails(uid, v, { batchIds: [String(batchId)] }),
    ]);

    return res.status(200).json({
      songs: results.map(mapToLogNested),
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
