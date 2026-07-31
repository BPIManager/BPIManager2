import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { calculateRadar } from "@/lib/radar/calculator";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    return parseStatsQuery(req.query, res);
  },
  async (req, res, { userId, version, levels, difficulties }) => {
    const [scores, validSongKeys] = await Promise.all([
      statsTablesRepo.getLatestScoresWithMusicData(
        userId,
        version,
        levels,
        difficulties,
      ),
      statsTablesRepo.getFilteredSongKeys(version, levels, difficulties),
    ]);

    return res.status(200).json(calculateRadar(scores, validSongKeys));
  },
);
