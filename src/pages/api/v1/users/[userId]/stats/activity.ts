import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default withUserApiHandler(
  (req, res) => {
    const query = parseStatsQuery(req.query, res);
    if (!query) return null;
    if (query.levels.length === 0 && query.difficulties.length === 0) {
      res.status(400).json({ message: "Required parameters are missing" });
      return null;
    }
    return query;
  },
  async (req, res, { userId, version, levels, difficulties }) => {
    const activity = await statsChartsRepo.getActivityData(
      userId,
      version,
      levels,
      difficulties,
    );

    return res.status(200).json(activity);
  },
);
