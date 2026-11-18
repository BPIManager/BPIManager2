import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQueryV2RequiringFilter } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsVersionCountDistribution } from "@/lib/subhandlers/stats";
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
    return parseStatsQueryV2RequiringFilter(req.query, res);
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsVersionCountDistribution(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
