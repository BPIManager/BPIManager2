import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleImportOptimizeMemo } from "@/lib/subhandlers/bpiOptimizer";
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
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    return { userId: String(req.query.userId) };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } =
      await handleImportOptimizeMemo(req);
    writeV2Result(res, withMeta(result, buildMeta(access.viewerId ?? viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
