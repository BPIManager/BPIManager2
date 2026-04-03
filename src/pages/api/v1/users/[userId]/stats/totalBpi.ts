import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { statsRepo } from "@/lib/db/stats";
import { BpiCalculator } from "@/lib/bpi";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { version, asOf } = req.query;

  if (!version || typeof version !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid version parameter." });
  }

  const targetTime =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs
          .tz(asOf as string)
          .endOf("day")
          .utc()
          .toDate();
  const [scores, totalCount] = await Promise.all([
    logsRepo.getScoresWithDetails(userId, version, {
      targetTime: targetTime,
      onlyLastPlayedInRange: {
        start: new Date(0),
        end: targetTime,
      },
    }),
    statsRepo.getTotalSongCount([12], []),
  ]);

  const level12Scores = scores.filter((s) => Number(s.difficultyLevel) === 12);

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET":
        return await handleGet(req, res, userId);
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
