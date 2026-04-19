import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { statsRepo } from "@/lib/db/stats";
import { BpiCalculator } from "@/lib/bpi";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { totalBpiSchema } from "@/schemas/stats/totalBpi";
import { parseQuery } from "@/services/nextRequest/parseBody";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(totalBpiSchema, req.query, res);
  if (!body) return;

  const { userId, version, asOf } = body;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET": {
        const targetTime =
          !asOf || asOf === "latest"
            ? dayjs.tz().utc().toDate()
            : dayjs.tz(asOf).endOf("day").utc().toDate();

        const [scores, totalCount] = await Promise.all([
          logsRepo.getScoresWithDetails(userId, version, {
            targetTime,
            onlyLastPlayedInRange: { start: new Date(0), end: targetTime },
          }),
          statsRepo.getTotalSongCount([12], []),
        ]);

        const level12Scores = scores.filter(
          (s) => Number(s.difficultyLevel) === 12,
        );
        const bpis = level12Scores.map((s) =>
          s.bpi !== null && s.bpi !== undefined ? Number(s.bpi) : -15,
        );
        const totalBpi = BpiCalculator.calculateTotalBPI(bpis, totalCount);
        const estimatedRank = BpiCalculator.estimateRank(totalBpi);

        return res.status(200).json({
          totalBpi,
          estimatedRank,
          playedCount: level12Scores.length,
          totalCount,
        });
      }
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
