import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { performanceSchema } from "@/schemas/stats/performance";
import { parseQueryV2 } from "@/services/nextRequest/parseBody";
import { handleStatsPerformance } from "@/lib/subhandlers/performance";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => parseQueryV2(performanceSchema, req.query, res),
  async (req, res, query, access) => {
    if (req.method !== "GET") {
      writeV2Result(res, err(405, "Method Not Allowed"));
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
