import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { handleStatsMonthlyReviewMonthlySummary } from "@/lib/subhandlers/stats";
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
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
    if (!userId || typeof userId !== "string") {
      writeV2Result(res, err(400, "Invalid userId"));
      return null;
    }
    if (!version || !isValidVersion) {
      writeV2Result(res, err(400, "Missing or invalid params: version"));
      return null;
    }
    return { userId, version };
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsMonthlyReviewMonthlySummary(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
