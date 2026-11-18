import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQueryV2 } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsBpmBpiDistribution } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    return parseStatsQueryV2(req.query, res);
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsBpmBpiDistribution(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
