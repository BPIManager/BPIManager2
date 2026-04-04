import { db } from "@/lib/db";
import { latestVersion } from "@/constants/latestVersion";
import fs from "fs/promises";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { songId } = req.query;

  if (!songId || Array.isArray(songId)) {
    return res.status(400).json({ message: "songId is required" });
  }

  try {
    const song = await db
      .selectFrom("songs")
      .select(["title", "difficulty", "difficultyLevel"])
      .where("songId", "=", Number(songId))
      .executeTakeFirst();

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const { difficultyLevel } = song;
    if (difficultyLevel !== 11 && difficultyLevel !== 12) {
      return res.status(200).json(null);
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "metrics",
      "arena",
      `${latestVersion}_${difficultyLevel}.json`,
    );

    const raw = await fs.readFile(filePath, "utf-8");
    const entries: Array<{
      title: string;
      difficulty: string;
      averages: Record<
        string,
        { avgExScore: number; rate: number; count: number; avgBpi?: number }
      >;
    }> = JSON.parse(raw);

    const entry = entries.find(
      (e) => e.title === song.title && e.difficulty === song.difficulty,
    );

    if (!entry) {
      return res.status(404).end();
    }

    return res.status(200).json(entry.averages);
  } catch (error: unknown) {
    console.error("Fetch arena averages error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
