import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { ticketsRepo } from "@/lib/db/aggregates/tickets";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { TicketRecommendResult } from "@/types/tickets";

const VERSION = latestVersion;

export default withUserApiHandler(
  (req) => {
    const { userId } = req.query as { userId: string };
    return { userId };
  },
  async (req, res, { userId }) => {
    if (req.method === "POST") {
      const { ticketIds, scoreMode } = req.body as {
        ticketIds: { ticketId: string; expiresAt: string }[];
        scoreMode?: "relative" | "raw";
      };
      const resolvedMode = scoreMode === "raw" ? "raw" : "relative";

      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: "ticketIds is required" });
      }
      if (ticketIds.length > 50) {
        return res
          .status(400)
          .json({ message: "Too many ticketIds (max 50)" });
      }

      const totalBpi = await ticketsRepo.getLatestTotalBpi(userId, VERSION);

      const results = await Promise.all(
        ticketIds.map(async ({ ticketId, expiresAt }) => {
          const { items, hasMore } = await ticketsRepo.getTopSongsForTicket(
            ticketId,
            userId,
            VERSION,
            totalBpi,
            0,
            resolvedMode,
          );
          return { ticketId, expiresAt, items, hasMore, totalBpi } satisfies TicketRecommendResult;
        }),
      );

      return res.status(200).json(results);
    }

    if (req.method === "GET") {
      const ticketId = req.query.ticketId as string;
      const expiresAt = (req.query.expiresAt as string) ?? "";
      const offset = parseInt((req.query.offset as string) ?? "0", 10);
      const scoreMode = req.query.scoreMode === "raw" ? "raw" : "relative";

      if (!ticketId) {
        return res.status(400).json({ message: "ticketId is required" });
      }

      const totalBpi = await ticketsRepo.getLatestTotalBpi(userId, VERSION);
      const { items, hasMore } = await ticketsRepo.getTopSongsForTicket(
        ticketId,
        userId,
        VERSION,
        totalBpi,
        offset,
        scoreMode,
      );

      const result: TicketRecommendResult = { ticketId, expiresAt, items, hasMore, totalBpi };
      return res.status(200).json(result);
    }

    return res.status(405).end();
  },
);
