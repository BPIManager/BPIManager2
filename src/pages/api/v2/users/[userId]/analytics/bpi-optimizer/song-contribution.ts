import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleSongContribution } from "@/lib/subhandlers/bpiOptimizer";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

const handler = withUserApiHandler(
  (req, res) => {
    if (req.method !== "POST") {
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    return { userId: String(req.query.userId) };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleSongContribution(
      req,
      access,
    );
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);

export default withRateLimit(handler, { windowMs: 60000, max: 30, name: "bpi-optimizer-song-contribution" });
