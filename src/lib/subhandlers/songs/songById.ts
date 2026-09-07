import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, type HandleOutcome } from "./_shared";
export async function handleSongById(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null)
    return { result: err(400, "Invalid songId"), ...base };
  try {
    const song = await songsRepo.getSongById(songIdNum);
    if (!song) return { result: err(404, "Song not found"), ...base };
    return { result: ok(song), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/arena-averages */
