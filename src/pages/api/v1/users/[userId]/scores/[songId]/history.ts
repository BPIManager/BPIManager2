import { scoresRepo } from "@/lib/db/domains/scores";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { songHistoryQuerySchema } from "@/schemas/scores/query";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const query = parseQuery(songHistoryQuerySchema, req.query, res);
  if (!query) return;
  const { userId, songId } = query;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
