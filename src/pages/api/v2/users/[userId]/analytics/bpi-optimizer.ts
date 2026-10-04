import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleBpiOptimizer } from "@/lib/subhandlers/bpiOptimizer";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withRateLimit(
  withUserApiHandler(
    (req, res) => {
      if (req.method !== "GET") {
        res.status(405).end();
        return null;
      }
      return { userId: String(req.query.userId) };
    },
    async (req, res, _query, access) => {
      const { result, targetUserId, viewerId } = await handleBpiOptimizer(
        req,
        access,
      );
      writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
    },
    {
      onReject: (res, access) => writeV2Result(res, accessError(access)!),
    },
  ),
  { windowMs: 60_000, max: 30, name: "bpi-optimizer" },
);
