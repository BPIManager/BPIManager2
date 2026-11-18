import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleScoresList } from "@/lib/subhandlers/scores";
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
    const userId = parseStringParam("userId", req.query.userId);
    if (userId === null) {
      writeV2Result(res, invalidParam("userId", req.query.userId, "Invalid userId"));
      return null;
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      writeV2Result(res, err(405, `Method ${req.method} Not Allowed`));
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleScoresList(
      req,
      access,
    );
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
