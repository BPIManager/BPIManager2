import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, resolveVersion, type HandleOutcome } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

export async function handleSongSimilar(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null)
    return { result: err(400, "Invalid songId"), ...base };

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
