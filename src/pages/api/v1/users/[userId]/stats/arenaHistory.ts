import { getArenaStatsHistory } from "@/lib/db/officialArenaStats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const userId = req.query.userId as string;
  const version = req.query.version as string;
  const start = req.query.start as string;
  const end = req.query.end as string;

  if (!version || !start || !end) {
    return res.status(400).json({ message: "Missing required params: version, start, end" });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ message: "Invalid date params" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const rows = await getArenaStatsHistory(userId, version, startDate, endDate);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("[arenaHistory]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
