import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import type { NextApiRequest, NextApiResponse } from "next";
import { createOvertakenMap, computeRivalRankMap } from "./[batchId]/scores";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { rejectAccess } from "@/middlewares/api/withApi";

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

  const { userId, batchId, version } = req.query;

  if (!userId || !batchId || !version) {
    return res
      .status(400)
      .json({ message: "userId, batchId, and version are required." });
  }

  const uid = String(userId);
  const bid = String(batchId);
  const v = String(version);

  try {
    const access = await checkProfileAccess(req, uid);
    if (!access.hasAccess) return rejectAccess(res, access);

    const targetBatch = await logsRepo.findBatchById(bid);
    if (!targetBatch) {
      return res.status(404).json({ message: "Batch not found." });
    }

    const jstDate = dayjs.utc(targetBatch.createdAt).tz().format("YYYY-MM-DD");
    const dayRange = logsRepo.getJstRange(jstDate, "day");
    const isOwnLog = access.viewerId === userId;

    const [nav, sameDay, scores, overtaken] = await Promise.all([
      logsRepo.getBatchNavigation(uid, v, targetBatch.createdAt, dayRange),
      logsRepo.findBatchesInRange(uid, v, dayRange.start, dayRange.end),
      logsRepo.getScoresWithDetails(uid, v, { batchIds: [bid] }),
      isOwnLog
        ? logsRepo.getOvertakenRivals(uid, v, {
            batchId: bid,
            range: { ...dayRange, basis: "createdAt" },
          })
        : [],
    ]);

    const overtakenMap = createOvertakenMap(overtaken);
    const overtakenSongIds = Object.keys(overtakenMap).map(Number).filter(Boolean);
    const rivalScores =
      isOwnLog && overtakenSongIds.length > 0
        ? await logsRepo.getRivalScoresForSongs({
            userId: uid,
            version: v,
            songIds: overtakenSongIds,
          })
        : [];
    const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

    return res.status(200).json({
      songs: scores.map((s) => {
        const mapped = mapToLogNested(s);
        return {
          ...mapped,
          overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
          rivalRankInfo: s.songId ? rivalRankMap[s.songId] ?? null : null,
        };
      }),
      pagination: {
        ...nav,
        current: targetBatch,
        dailyBatchIds: sameDay.map((b) => b.batchId),
        dailyBatchCount: sameDay.length,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
