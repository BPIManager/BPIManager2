import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleBatchesList } from "@/lib/subhandlers/batches";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";
import { invalidParam, parseStringParam } from "@/lib/validation/params";

export default withUserApiHandler(
  (req, res) => {
    const userId = parseStringParam("userId", req.query.userId);
    if (userId === null) {
      writeV2Result(res, invalidParam("userId", req.query.userId, "Invalid userId"));
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleBatchesList(
      req,
      access,
    );
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
