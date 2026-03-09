import { LogRepository } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, date, type } = req.query;
  const repo = new LogRepository();

  const range = repo.getJstRange(date as string, type as any);

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess)
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });

    const batches = await repo.findBatchesInRange(
      String(userId),
      String(version),
      range.start,
      range.end,
    );
    if (batches.length === 0)
      return res.status(404).json({ message: "No logs found in this period." });

    const firstBatchCreatedAt = batches[0].createdAt;

    const [nav, results] = await Promise.all([
      repo.getRangeNavigation(String(userId), String(version), range),
      repo.getScoresWithDetails(String(userId), String(version), {
        batchIds: batches.map((b) => b.batchId),
        comparisonTime: firstBatchCreatedAt,
      }),
    ]);

    return res.status(200).json({
      songs: results.map(LogRepository.mapToLogNested),
      pagination: {
        ...nav,
        current: batches[batches.length - 1],
        dailyBatchIds: batches.map((b) => b.batchId),
        dailyBatchCount: batches.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
