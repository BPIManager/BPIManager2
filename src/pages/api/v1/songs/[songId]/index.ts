import type { NextApiRequest, NextApiResponse } from "next";
import { songsRepo } from "@/lib/db/songs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const { songId } = req.query;
  if (!songId || Array.isArray(songId))
    return res.status(400).json({ message: "Invalid songId" });

  const songIdNum = parseInt(songId, 10);
  if (isNaN(songIdNum))
    return res.status(400).json({ message: "Invalid songId" });

  try {
    const song = await songsRepo.getSongById(songIdNum);
    if (!song) return res.status(404).json({ message: "Song not found" });
    return res.status(200).json(song);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
