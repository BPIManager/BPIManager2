import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { socialRepo } from "@/lib/db/social";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, version, songId } = req.query;

  if (!userId || !version || !songId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;

  if (!viewerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const rivalsScores = await socialRepo.getRivalScoresForSong({
      viewerId,
      songId: Number(songId),
      version: version as string,
    });

    const formattedRivals = rivalsScores.map((r) => ({
      userId: r.userId,
      userName: r.userName,
      profileImage: r.profileImage,
      exScore: r.exScore,
      bpi: r.bpi !== null ? Number(r.bpi) : -15.0,
      clearState: r.clearState,
      lastPlayed: r.lastPlayed,
      metadata: {
        wrScore: r.wrScore,
        kaidenAvg: r.kaidenAvg,
      },
    }));

    return res.status(200).json({
      songId: Number(songId),
      version,
      rivals: formattedRivals,
    });
  } catch (error) {
    console.error("Rival Song Scores API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
