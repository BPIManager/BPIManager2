import { NextApiRequest, NextApiResponse } from "next";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { activeDatesSchema } from "@/schemas/stats/activeDates";
import { parseQuery } from "@/services/nextRequest/parseBody";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(activeDatesSchema, req.query, res);
  if (!body) return;

  const { userId, version } = body;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET": {
        const activity = await statsRepo.getActivityData(userId, version, [12]);
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
