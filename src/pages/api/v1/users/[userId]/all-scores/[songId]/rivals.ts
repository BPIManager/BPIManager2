import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { allScoresRepo } from "@/lib/db/allScores";
import { latestVersion, IIDX_VERSIONS } from "@/constants/latestVersion";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, songId } = req.query;

  if (!userId || !songId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess) return rejectAccess(res, access);

    const rawVersion = String(req.query.version ?? "");
    const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
      ? rawVersion
      : latestVersion;

    const rivalsScores = await allScoresRepo.getRivalScoresForAllSong({
      viewerId: String(userId),
      songId: Number(songId),
      version,
    });

    return res.status(200).json({
      songId: Number(songId),
      version,
      rivals: rivalsScores.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        exScore: r.exScore,
        bpi: r.bpi !== null ? Number(r.bpi) : null,
        clearState: r.clearState,
        lastPlayed: r.lastPlayed,
      })),
    });
  } catch (error) {
    console.error("All-Score Rival Scores API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
