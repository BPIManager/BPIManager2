import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQueryV2 } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsRadar } from "@/lib/subhandlers/stats";
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
    return parseStatsQueryV2(req.query, res);
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
