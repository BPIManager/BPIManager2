import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { performanceSchema } from "@/schemas/stats/performance";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { handleStatsPerformance } from "@/lib/subhandlers/performance";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => parseQuery(performanceSchema, req.query, res),
  async (req, res, query, access) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return;
    }
    writeV2Result(
      res,
      withMeta(
        await handleStatsPerformance(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
