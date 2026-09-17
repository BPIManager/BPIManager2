import type { NextApiRequest } from "next";
import { songsRepo } from "@/lib/db/domains/songs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, resolveVersion, type HandleOutcome, type IIDXVersion } from "./_shared";

const SEARCH_LIMIT = 20;

/** GET /songs/search?title=...&version=...&difficultyLevel=12 */
export async function handleSongSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  if (title.length === 0) {
    return { result: ok([]), ...base };
  }

  try {
    const songs = await songsRepo.searchSongs({
      version: resolveVersion(req.query.version) as IIDXVersion,
      title,
      difficultyLevel: num(req.query.difficultyLevel) ?? undefined,
      limit: SEARCH_LIMIT,
    });
    return { result: ok(songs), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
