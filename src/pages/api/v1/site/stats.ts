import fs from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

const STATS_FILE = path.join(process.cwd(), "public/data/info/stats.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const raw = await fs.readFile(STATS_FILE, "utf-8");
    const data = JSON.parse(raw);

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch {
    return res.status(503).json({ message: "Stats data is not yet available. Please try again later." });
  }
}
