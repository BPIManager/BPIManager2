import { NextApiRequest, NextApiResponse } from "next";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { version } = req.query;

  if (!version || typeof version !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid version parameter." });
  }

  const activity = await statsRepo.getActivityData(userId, version, [12]);
  const dates = activity
    .filter((d) => Number(d.count) > 0)
    .map((d) => d.date);

  return res.status(200).json(dates);
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
