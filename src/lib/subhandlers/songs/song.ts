import type { NextApiRequest } from "next";
import fs from "fs/promises";
import path from "path";
import { songsRepo } from "@/lib/db/domains/songs";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, resolveVersion, type HandleOutcome } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

export async function handleSongsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  try {
    const songs = await songsRepo.getSongList(
      resolveVersion(req.query.version) as IIDXVersion,
    );
    return { result: ok(songs), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId] */
export async function handleSongById(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) return { result: err(400, "Invalid songId"), ...base };
  try {
    const song = await songsRepo.getSongById(songIdNum);
    if (!song) return { result: err(404, "Song not found"), ...base };
    return { result: ok(song), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/arena-averages */
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
export async function handleSongDefinitions(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const { songId } = req.query;
  if (!songId || Array.isArray(songId)) {
    return { result: err(400, "songId is required"), ...base };
  }
  try {
    const definitions = await songsRepo.getDefinitionHistory(Number(songId));
    return { result: ok(definitions), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/ranking */
export async function handleSongRanking(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) {
    return {
      result: err(400, "Invalid songId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const version = resolveVersion(req.query.version);
  try {
    const viewerId = (await resolveOptionalUid(req)) ?? null;
    const result = await statsTablesRepo.getSongRanking(
      songIdNum,
      version,
      viewerId ?? undefined,
    );
    return { result: ok(result), targetUserId: "", viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: "",
      viewerId: null,
    };
  }
}

/** GET /songs/[songId]/similar */
export async function handleSongSimilar(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) return { result: err(400, "Invalid songId"), ...base };

  const version = resolveVersion(req.query.version) as IIDXVersion;
  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);
  const mode = req.query.mode === "global" ? "global" : "profile";
  try {
    const result = await songsRepo.getSimilarSongs(
      songIdNum,
      version,
      limit,
      mode,
    );
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* ------------------------------ notes ------------------------------ */

/** GET /songs/[songId]/notes */
