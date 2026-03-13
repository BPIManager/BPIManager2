import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";
import dayjs from "@/lib/dayjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, topN, since, until } = req.query;
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

  if (!userId || !version) {
    return res
      .status(400)
      .json({ message: "userId and version are required." });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const timelineLogs = await logsRepo.getTimelineLogs({
      userId: userId as string,
      version: version as string,
      topN: topN ? Number(topN) : 5,
      since: sinceDate,
      until: untilDate,
    });

    return res.status(200).json(timelineLogs);
  } catch (error: any) {
    console.error("Fetch timeline logs error:", error);
    return res.status(500).json({ message: error.message });
  }
}
