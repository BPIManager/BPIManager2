import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { scoreRateDistributionParamsSchema } from "@/schemas/stats/scoreRateDistribution";
import { handleStatsScoreRateDistribution } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    const q = parseStatsQuery(req.query, res);
    if (!q) return null;
    const body = parseQuery(scoreRateDistributionParamsSchema, req.query, res);
    if (!body) return null;
    return { ...q, ...body };
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsScoreRateDistribution(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
