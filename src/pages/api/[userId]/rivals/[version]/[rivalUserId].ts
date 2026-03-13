import { logsRepo } from "@/lib/db/logs";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { sortSongs } from "@/utils/songs/sort";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, rivalUserId, version, ...filterParams } = req.query;

  if (!userId || !rivalUserId || !version) {
    return res
      .status(400)
      .json({ message: "userId, rivalUserId and version are required" });
  }

  try {
    const access = await checkProfileAccess(req, String(userId));
    const viewerId = access.viewerId;
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }
    const rawResults = await logsRepo.getRivalComparisonScores({
      viewerId: String(viewerId),
      rivalId: String(rivalUserId),
      version: String(version),
    });

    const compared = rawResults
      .map((row) => {
        const myEx = row.myExScore !== null ? Number(row.myExScore) : null;
        const rivalEx =
          row.rivalExScore !== null ? Number(row.rivalExScore) : null;
        const myBpi = row.myBpi !== null ? Number(row.myBpi) : null;
        const rivalBpi = row.rivalBpi !== null ? Number(row.rivalBpi) : null;

        const exDiff = (myEx ?? 0) - (rivalEx ?? 0);
        const bpiDiff =
          Math.round(((myBpi ?? -15) - (rivalBpi ?? -15)) * 100) / 100;

        return {
          songId: row.songId,
          title: row.title || "Unknown Title",
          notes: Number(row.notes || 0),
          bpm: row.bpm || "0",
          difficulty: row.difficulty || "ANOTHER",
          difficultyLevel: Number(row.difficultyLevel || 12),
          releasedVersion: row.releasedVersion || 0,
          wrScore: row.wrScore || null,
          kaidenAvg: row.kaidenAvg || null,
          coef: row.coef || null,

          logId: row.myLogId ? Number(row.myLogId) : null,
          exScore: myEx,
          bpi: myBpi,
          clearState: row.myClearState || "NO PLAY",
          missCount: row.myMissCount !== null ? Number(row.myMissCount) : null,
          scoreAt: row.myLastPlayed || null,

          rival: {
            userId: row.rivalUserId,
            userName: row.rivalUserName,
            exScore: rivalEx,
            bpi: rivalBpi,
            clearState: row.rivalClearState || "NO PLAY",
            missCount:
              row.rivalMissCount !== null ? Number(row.rivalMissCount) : null,
            lastPlayed: row.rivalLastPlayed || null,
          },

          exDiff,
          bpiDiff,
          lastPlayedMax:
            row.myLastPlayed && row.rivalLastPlayed
              ? new Date(row.myLastPlayed) > new Date(row.rivalLastPlayed)
                ? row.myLastPlayed
                : row.rivalLastPlayed
              : row.myLastPlayed || row.rivalLastPlayed || null,
        };
      })
      .filter((song) => song.exScore !== null || song.rival.exScore !== null);

    const sorted = sortSongs(compared, filterParams);

    return res.status(200).json(sorted);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
