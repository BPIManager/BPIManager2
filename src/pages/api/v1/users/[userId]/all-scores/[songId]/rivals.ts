import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { allScoresAggregateRepo } from "@/lib/db/aggregates/allScores";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }

    const { userId, songId } = req.query;

    if (!userId || !songId) {
      res.status(400).json({ message: "Missing required parameters" });
      return null;
    }

    return { userId: String(userId), songId };
  },
  async (req, res, { userId, songId }) => {
    const rawVersion = String(req.query.version ?? "");
    const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
      ? rawVersion
      : latestVersion;

    const rivalsScores = await allScoresAggregateRepo.getRivalScoresForAllSong({
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
  },
  {
    onError: (error, res) => {
      console.error("All-Score Rival Scores API Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    },
  },
);
