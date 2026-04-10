import type { NextApiRequest, NextApiResponse } from "next";
import { songPatternsRepo } from "@/lib/db/songPatterns";

function parseSongId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const songId = parseSongId(req.query.songId);
  if (songId === null) return res.status(400).json({ message: "Invalid songId" });

  const q = req.query.q;
  if (!q || Array.isArray(q) || !/^\d{7}$/.test(q)) {
    return res.status(400).json({ message: "Invalid pattern" });
  }

  const result = await songPatternsRepo.searchPattern(songId, q);
  if (!result) return res.status(404).json(null);
  return res.status(200).json(result);
}
