import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";

async function handleGetBatches(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { version, topN, since, until } = req.query;

  if (!version || typeof version !== "string") {
    return res.status(400).json({ message: "version parameter is required." });
  }

  const sinceDate = since
    ? dayjs
        .tz(since as string)
        .startOf("day")
        .utc()
        .toDate()
    : undefined;

  const untilDate = until
    ? dayjs
        .tz(until as string)
        .endOf("day")
        .utc()
        .toDate()
    : undefined;

  const timelineLogs = await logsRepo.getTimelineLogs({
    userId,
    version,
    topN: topN ? Number(topN) : 5,
    since: sinceDate,
    until: untilDate,
  });

  return res.status(200).json(timelineLogs);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;
  const uid = userId as string;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const access = await checkUserAccess(req, uid);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    return await handleGetBatches(req, res, uid);
  } catch (error: any) {
    console.error("Fetch batches error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
}
