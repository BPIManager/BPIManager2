import fs from "fs/promises";
import path from "path";
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

    // distribution から上位クラスの累積人数オフセットを構築
    const classOffsets = new Map<string, number>();
    try {
      const distPath = path.join(process.cwd(), `public/data/info/arena_official/${version}/latest.json`);
      const dist = JSON.parse(await fs.readFile(distPath, "utf-8")) as {
        distribution: { rank: string; count: number }[];
      };
      let cumulative = 0;
      for (const { rank: cls, count } of dist.distribution) {
        classOffsets.set(cls, cumulative);
        cumulative += count;
      }
    } catch {}

    const result = rows.map((r) => ({
      fetchedAt: r.fetchedAt,
      arenaClass: r.arenaClass,
      arenaRank: r.arenaRank,
      wins: r.wins,
      classRank: r.arenaRank,
      globalRank: r.arenaRank !== null
        ? (classOffsets.get(r.arenaClass) ?? 0) + r.arenaRank
        : null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("[arenaHistory]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
