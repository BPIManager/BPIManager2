import { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { latestVersion } from "@/constants/latestVersion";
import { SocialRepository } from "@/lib/db/social";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId, lastId, mode, search } = req.query;

  const levelsQuery = req.query["levels[]"] || req.query.levels;
  const diffsQuery = req.query["difficulties[]"] || req.query.difficulties;

  const levels = Array.isArray(levelsQuery)
    ? levelsQuery.map(Number)
    : levelsQuery
      ? [Number(levelsQuery)]
      : undefined;

  const difficulties = Array.isArray(diffsQuery)
    ? diffsQuery
    : diffsQuery
      ? [diffsQuery as string]
      : undefined;

  const limit = 20;
  const version = latestVersion;

  const access = await checkUserAccess(req, userId as string);
  const viewerId = access.user?.userId;
  if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const socialRepo = new SocialRepository();

    const timeline = await socialRepo.getFollowedTimeline({
      viewerId,
      version,
      limit,
      lastId: lastId as string,
      mode: (mode as "all" | "played" | "overtaken") || "all",
      search: search as string,
      levels,
      difficulties,
    });

    if (timeline.length === 0) {
      return res.status(200).json({ timeline: [], nextId: null });
    }

    const songIds = Array.from(new Set(timeline.map((t) => Number(t.songId))));
    const viewerScores = await socialRepo.getViewerScoresForSongs(
      viewerId,
      version,
      songIds,
    );
    const viewerScoreMap = new Map(viewerScores.map((s) => [s.songId, s]));

    const result = timeline.map((entry) => {
      const myScore = viewerScoreMap.get(entry.songId);
      const oppEx = Number(entry.exScore);
      const oppBpi = Number(entry.bpi);
      const myEx = myScore ? Number(myScore.exScore) : null;
      const myBpi = myScore ? Number(myScore.bpi) : null;
      const prevEx =
        entry.prevExScore !== null ? Number(entry.prevExScore) : -1;

      const isOvertaken = !!(myEx !== null && prevEx < myEx && oppEx > myEx);

      return {
        logId: Number(entry.logId),
        userId: entry.userId,
        userName: entry.userName,
        profileImage: entry.profileImage,
        songId: Number(entry.songId),
        title: entry.title,
        difficulty: entry.difficulty,
        difficultyLevel: Number(entry.difficultyLevel),
        lastPlayed: entry.lastPlayed,
        wrScore: Number(entry.wrScore),
        kaidenAvg: Number(entry.kaidenAvg),
        isOvertaken,
        opponentScore: {
          currentEx: oppEx,
          prevEx: prevEx === -1 ? null : prevEx,
          diffEx: prevEx === -1 ? null : oppEx - prevEx,
          currentBpi: oppBpi,
          prevBpi: entry.prevBpi !== null ? Number(entry.prevBpi) : null,
          diffBpi:
            entry.prevBpi !== null ? oppBpi - Number(entry.prevBpi) : null,
        },
        viewerScore: myScore
          ? {
              exScore: myEx,
              bpi: myBpi,
              clearState: myScore.clearState,
              diffFromOpponentEx: (myEx || 0) - oppEx,
              diffFromOpponentBpi: (myBpi || 0) - oppBpi,
            }
          : null,
      };
    });

    return res.status(200).json({
      timeline: result,
      nextId:
        timeline.length === limit
          ? timeline[timeline.length - 1].lastPlayed
          : null,
    });
  } catch (error: any) {
    console.error("Timeline API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
