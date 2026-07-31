import { scoreTimelineRepo } from "@/lib/db/aggregates/scoreTimeline";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { parseBody } from "@/services/nextRequest/parseBody";
import { batchesQuerySchema } from "@/schemas/batches/query";

export default withUserApiHandler(
  (req, res) => parseBody(batchesQuerySchema, req.query, res),
  async (req, res, { userId, version, groupedBy, topN }) => {
    if (groupedBy === "lastPlayed") {
      const [history, totalSongs12] = await Promise.all([
        statsTablesRepo.getScoreHistory(userId, version, [], []),
        statsTablesRepo.getTotalSongCount([12], []),
      ]);
      const timeline = calculateTotalBpi(history, totalSongs12, version, topN);
      return res.status(200).json(timeline);
    } else {
      const timeline = await scoreTimelineRepo.getTimelineByBatches({
        userId,
        version,
        topN,
      });
      return res.status(200).json(timeline);
    }
  },
);
