import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { activeDatesSchema } from "@/schemas/stats/activeDates";
import { parseQuery } from "@/services/nextRequest/parseBody";

export default withUserApiHandler(
  (req, res) => parseQuery(activeDatesSchema, req.query, res),
  async (req, res, { userId, version }) => {
    switch (req.method) {
      case "GET": {
        const activity = await statsChartsRepo.getActivityData(userId, version, [12]);
        const dates = activity
          .filter((d) => Number(d.count) > 0)
          .map((d) => d.date);
        return res.status(200).json(dates);
      }
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  },
);
