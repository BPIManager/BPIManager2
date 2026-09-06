import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { activeDatesSchema } from "@/schemas/stats/activeDates";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { handleStatsActiveDates } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => parseQuery(activeDatesSchema, req.query, res),
  async (req, res, query) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
    }
    writeV1Result(res, await handleStatsActiveDates(query));
  },
);
