import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleAllSongRivals } from "@/lib/subhandlers/allScores";
import {
  accessError,
  buildMeta,
  err,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }

    const { userId, songId } = req.query;
    if (!userId || !songId) {
      writeV2Result(res, err(400, "Missing required parameters"));
      return null;
    }

    return { userId: String(userId), songId };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleAllSongRivals(
      req,
      access,
    );
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onError: (error, res) => {
      console.error("All-Score Rival Scores API Error:", error);
      return writeV2Result(res, err(500, "Internal Server Error"));
    },
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
