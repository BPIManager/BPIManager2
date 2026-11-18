import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleBatchesList } from "@/lib/subhandlers/batches";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      writeV2Result(res, err(400, "Invalid userId"));
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
