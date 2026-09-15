import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { handleStatsMonthlyReviewArena } from "@/lib/subhandlers/stats";
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
    const month = req.query.month as string;
    const isYearMode = /^\d{4}$/.test(month ?? "");
    const isMonthMode = /^\d{4}-\d{2}$/.test(month ?? "");
    const isAllMode = month === "all";
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (
      !version ||
      !isValidVersion ||
      !month ||
      (!isYearMode && !isMonthMode && !isAllMode)
    ) {
      res.status(400).json({
        message:
          "Missing or invalid params: version, month (YYYY-MM, YYYY or all)",
      });
      return null;
    }
    return { userId, version, month };
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsMonthlyReviewArena(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
