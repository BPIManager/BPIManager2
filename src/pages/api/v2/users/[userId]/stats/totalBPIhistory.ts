import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsTotalBpiHistory } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    return parseStatsQuery(req.query, res);
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsTotalBpiHistory(query, req),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
