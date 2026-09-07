import type { NextApiRequest } from "next";
import fs from "fs/promises";
import path from "path";
import { songsRepo } from "@/lib/db/domains/songs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { type HandleOutcome } from "./_shared";
export async function handleSongArenaAverages(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const { songId } = req.query;
  if (!songId || Array.isArray(songId)) {
    return { result: err(400, "songId is required"), ...base };
  }
  try {
    const song = await songsRepo.getTitleDifficultyLevel(Number(songId));
    if (!song) return { result: err(404, "Song not found"), ...base };

    const { difficultyLevel } = song;
    if (difficultyLevel !== 11 && difficultyLevel !== 12) {
      return { result: ok(null), ...base };
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
    if (!entry) return { result: err(404, "Not found"), ...base };
    return { result: ok(entry.averages), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/definitions */
