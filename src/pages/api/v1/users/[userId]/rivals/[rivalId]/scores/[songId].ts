import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { logsRepo } from "@/lib/db/logs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, rivalId, songId, version } = req.query;

  if (!userId || !rivalId || !songId || !version) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess) return rejectAccess(res, access);

    const result = await logsRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId: String(rivalId),
      version: String(version),
    });

    const rivalData = result.find((r) => r.songId === Number(songId));

    if (!rivalData) {
      return res.status(404).json({ message: "Rival score not found" });
    }

    return res.status(200).json({
      songId: Number(songId),
      version: String(version),
      rival: {
        userId: rivalData.rivalUserId ?? null,
        userName: rivalData.rivalUserName ?? null,
        profileImage: null,
        exScore: rivalData.rivalExScore,
        bpi: rivalData.rivalBpi !== null ? Number(rivalData.rivalBpi) : -15.0,
        clearState: rivalData.rivalClearState,
        lastPlayed: rivalData.rivalLastPlayed,
        metadata: {
          wrScore: rivalData.wrScore,
          kaidenAvg: rivalData.kaidenAvg,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
