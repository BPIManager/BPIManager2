import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { activeDatesSchema } from "@/schemas/stats/activeDates";
import { parseQueryV2 } from "@/services/nextRequest/parseBody";
import { handleStatsActiveDates } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => parseQueryV2(activeDatesSchema, req.query, res),
  async (req, res, query, access) => {
    if (req.method !== "GET") {
      writeV2Result(res, err(405, "Method Not Allowed"));
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
