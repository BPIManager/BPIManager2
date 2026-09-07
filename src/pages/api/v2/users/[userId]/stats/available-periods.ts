import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

import { handleStatsAvailablePeriods } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    if (!version) {
      res.status(400).json({ message: "Missing param: version" });
      return null;
    }
    return { userId, version };
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsAvailablePeriods(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
