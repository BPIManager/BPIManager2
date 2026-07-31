import { scoresRepo } from "@/lib/db/domains/scores";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { songHistoryQuerySchema } from "@/schemas/scores/query";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ message: "Method not allowed" });
      return null;
    }
    return parseQuery(songHistoryQuerySchema, req.query, res);
  },
  async (req, res, { userId, songId }) => {
    const history = await scoresRepo.getHistoryForSong(userId, songId);

    const groupedHistory = history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );

    return res.status(200).json(groupedHistory);
  },
);
