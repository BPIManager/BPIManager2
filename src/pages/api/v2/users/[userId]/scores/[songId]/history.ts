import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleScoreHistory } from "@/lib/subhandlers/scores";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      writeV2Result(res, err(405, "Method not allowed"));
      return null;
    }
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      writeV2Result(res, err(400, "Invalid userId"));
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleScoreHistory(
      req,
      access,
    );
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
