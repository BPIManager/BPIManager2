import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsRadar } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    return parseStatsQuery(req.query, res);
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsRadar(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
