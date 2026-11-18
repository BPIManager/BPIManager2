import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

import { handleStatsAvailablePeriods } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import { parseInput } from "@/lib/validation/parse";
import { availablePeriodsQuerySchema } from "@/schemas/stats/routeQueries";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    const q = parseInput(availablePeriodsQuerySchema, req.query, {
      in: "query",
      message: "Missing param: version",
    });
    if (!q.success) {
      writeV2Result(res, q.result);
      return null;
    }
    return q.data;
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsAvailablePeriods(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
