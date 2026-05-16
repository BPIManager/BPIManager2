import fs from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import type { SongPlayerEntry } from "@/types/siteStats";

const SONGS_FILE = path.join(process.cwd(), "public/data/info/songs.json");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const order = req.query.order === "bottom" ? "bottom" : "top";
  const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10) || 0);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10));

  try {
    const raw = await fs.readFile(SONGS_FILE, "utf-8");
    const { songs: allSongs }: { songs: SongPlayerEntry[] } = JSON.parse(raw);

    // top = 降順（ファイルはplayerCount降順で保存済み）
    // bottom = 昇順（逆順）
    const ordered = order === "bottom" ? [...allSongs].reverse() : allSongs;
    const page = ordered.slice(offset, offset + limit);

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).json({
      songs: page,
      total: allSongs.length,
      hasMore: offset + page.length < allSongs.length,
    });
  } catch {
    return res.status(503).json({ message: "Song data is not yet available. Please try again later." });
  }
}
