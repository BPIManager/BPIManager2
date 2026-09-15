import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { handleStatsMonthlyReviewMonthlySummary } from "@/lib/subhandlers/stats";
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
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (!version || !isValidVersion) {
      res.status(400).json({ message: "Missing or invalid params: version" });
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
