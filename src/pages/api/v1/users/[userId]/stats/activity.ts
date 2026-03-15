import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, version, levels, difficulties } = parseStatsQuery(req.query);

  if (levels.length === 0 && difficulties.length === 0) {
    return res.status(400).json({ message: "Required parameters are missing" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const activity = await statsRepo.getActivityData(
      userId,
      version,
      levels,
      difficulties,
    );

    return res.status(200).json(activity);
  } catch (error: any) {
    console.error("Activity Data Error:", error);
    return res.status(500).json({ message: error.message });
  }
}
