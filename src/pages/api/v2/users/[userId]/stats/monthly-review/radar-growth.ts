import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleStatsMonthlyReviewRadarGrowth } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";
import { parseMonthlyReviewQuery } from "@/lib/subhandlers/stats/monthlyReviewV2/routeQuery";

export default withUserApiHandler(
  parseMonthlyReviewQuery,
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsMonthlyReviewRadarGrowth(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
