import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { type HandleOutcome } from "./_shared";
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
