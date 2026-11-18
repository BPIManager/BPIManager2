import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleScoreHistory } from "@/lib/subhandlers/scores";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import { invalidParam, parseStringParam } from "@/lib/validation/params";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      writeV2Result(res, err(405, "Method not allowed"));
      return null;
    }
    const userId = parseStringParam("userId", req.query.userId);
    if (userId === null) {
      writeV2Result(res, invalidParam("userId", req.query.userId, "Invalid userId"));
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
