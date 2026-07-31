import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { rejectAccess } from "@/middlewares/api/withApi";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { rivalScoreDetailQuerySchema } from "@/schemas/rivals/rivalId/scores/query";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const query = parseQuery(rivalScoreDetailQuerySchema, req.query, res);
    if (!query) return null;

    const { userId, rivalId, songId, version } = query;
    if (!userId || !rivalId || !songId || !version) {
      res.status(400).json({ message: "Missing required parameters" });
      return null;
    }

    return query;
  },
  async (req, res, { userId, rivalId, songId, version }) => {
    const rivalAccess = await checkProfileAccess(req, String(rivalId));
    if (!rivalAccess.hasAccess) return rejectAccess(res, rivalAccess);

    const result = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId: String(rivalId),
      version: version,
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
  },
);
