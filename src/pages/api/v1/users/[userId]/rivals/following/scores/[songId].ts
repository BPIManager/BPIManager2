import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { socialRepo } from "@/lib/db/social";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { rivalFollowingScoresQuerySchema } from "@/schemas/rivals/following/scores/query";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const query = parseQuery(rivalFollowingScoresQuerySchema, req.query, res);
  if (!query) return;

  const { userId, songId, version } = query;

  if (!userId || !songId || !version) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess) return rejectAccess(res, access);

    const rivalsScores = await socialRepo.getRivalScoresForSong({
      viewerId: String(userId),
      songId: Number(songId),
      version: version,
    });

    return res.status(200).json({
      songId: Number(songId),
      version: String(version),
      rivals: rivalsScores.map(formatRivalScore),
    });
  } catch (error) {
    console.error("Rival Following Scores API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export const formatRivalScore = (
  r: Awaited<ReturnType<typeof socialRepo.getRivalScoresForSong>>[number],
) => ({
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
});
