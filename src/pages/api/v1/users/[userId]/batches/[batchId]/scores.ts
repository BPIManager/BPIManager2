import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { mapToLogNested } from "@/utils/logs/getMapNested";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  const { userId, batchId, version, type = "day" } = req.query;

  if (!userId || !batchId || !version) {
    return res.status(400).json({
      message: "userId, batchId (date string), and version are required.",
    });
  }

  const uid = String(userId);
  const dateStr = String(batchId);
  const ver = String(version);

  try {
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const range = logsRepo.getJstRange(dateStr, type as any);

    const batches = await logsRepo.findBatchesInRange(
      uid,
      ver,
      range.start,
      range.end,
    );

    if (batches.length === 0) {
      return res.status(404).json({ message: "No logs found for this date." });
    }

    const firstBatchCreatedAt = batches[0].createdAt;

    const [nav, results] = await Promise.all([
      logsRepo.getRangeNavigation(uid, ver, range),
      logsRepo.getScoresWithDetails(uid, ver, {
        batchIds: batches.map((b) => b.batchId),
        comparisonTime: firstBatchCreatedAt,
      }),
    ]);

    return res.status(200).json({
      songs: results.map(mapToLogNested),
      pagination: {
        ...nav,
        current: batches[batches.length - 1],
        dailyBatchIds: batches.map((b) => b.batchId),
        dailyBatchCount: batches.length,
      },
    });
  } catch (error: any) {
    console.error(`Fetch Daily Batch Detail Error:`, error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
