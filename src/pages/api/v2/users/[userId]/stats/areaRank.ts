import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { z } from "zod";
import { handleStatsAreaRank } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    return parseQuery(z.object({ userId: z.string() }), req.query, res);
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsAreaRank(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
