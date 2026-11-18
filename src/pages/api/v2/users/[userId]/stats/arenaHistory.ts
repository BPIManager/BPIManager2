import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { handleStatsArenaHistory } from "@/lib/subhandlers/stats";
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
      res.setHeader("Allow", ["GET"]);
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const start = req.query.start as string;
    const end = req.query.end as string;
    if (!version || !start || !end) {
      writeV2Result(res, err(400, "Missing required params: version, start, end"));
      return null;
    }
    if (!(IIDX_VERSIONS as readonly string[]).includes(version)) {
      writeV2Result(res, err(400, "Invalid version param"));
      return null;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      writeV2Result(res, err(400, "Invalid date params"));
      return null;
    }
    return { userId, version, startDate, endDate };
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsArenaHistory(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
