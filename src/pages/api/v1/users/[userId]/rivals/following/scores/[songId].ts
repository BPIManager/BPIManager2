import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { rivalFollowingScoresQuerySchema } from "@/schemas/rivals/following/scores/query";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const query = parseQuery(rivalFollowingScoresQuerySchema, req.query, res);
    if (!query) return null;

    const { userId, songId, version } = query;
    if (!userId || !songId || !version) {
      res.status(400).json({ message: "Missing required parameters" });
      return null;
    }

    return query;
  },
  async (req, res, { userId, songId, version }) => {
    const rivalsScores = await rivalRepo.getFollowedScoresForSong({
      viewerId: String(userId),
      songId: Number(songId),
      version: version,
    });

    return res.status(200).json({
      songId: Number(songId),
      version: String(version),
      rivals: rivalsScores.map(formatRivalScore),
    });
  },
  {
    onError: (error, res) => {
      console.error("Rival Following Scores API Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    },
  },
);

export const formatRivalScore = (
  r: Awaited<ReturnType<typeof rivalRepo.getFollowedScoresForSong>>[number],
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
