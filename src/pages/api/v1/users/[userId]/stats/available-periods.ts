import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

import { handleStatsAvailablePeriods } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export interface AvailablePeriodsData {
  months: string[]; // YYYY-MM, desc order
}

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
  async (req, res, query) => {
    writeV1Result(res, await handleStatsAvailablePeriods(query));
  },
);
