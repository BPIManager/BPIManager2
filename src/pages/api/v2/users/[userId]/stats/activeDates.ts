import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { activeDatesSchema } from "@/schemas/stats/activeDates";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { handleStatsActiveDates } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => parseQuery(activeDatesSchema, req.query, res),
  async (req, res, query, access) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return;
    }
    writeV2Result(
      res,
      withMeta(
        await handleStatsActiveDates(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
