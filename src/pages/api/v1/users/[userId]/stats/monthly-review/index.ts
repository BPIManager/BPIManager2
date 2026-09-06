import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { handleStatsMonthlyReview } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const month = req.query.month as string;
    const isYearMode = /^\d{4}$/.test(month ?? "");
    const isMonthMode = /^\d{4}-\d{2}$/.test(month ?? "");
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (!version || !isValidVersion || !month || (!isYearMode && !isMonthMode)) {
      res.status(400).json({
        message: "Missing or invalid params: version, month (YYYY-MM or YYYY)",
      });
      return null;
    }
    return { userId, version, month };
  },
  async (req, res, query, access) => {
    writeV1Result(res, await handleStatsMonthlyReview(query, access));
  },
);
