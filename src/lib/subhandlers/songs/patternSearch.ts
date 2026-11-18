import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";
export async function handleSongPatternSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songId = parseIntParam("songId", req.query.songId);
  if (songId === null) return { result: invalidParam("songId", req.query.songId, "Invalid songId"), ...base };

  const q = req.query.q;
  if (!q || Array.isArray(q) || !/^\d{7}$/.test(q)) {
    return { result: invalidParam("pattern", req.query.pattern, "Invalid pattern"), ...base };
  }
  const result = await songPatternsRepo.searchPattern(songId, q);
  if (!result) return { result: ok(null), ...base };
  return { result: ok(result), ...base };
}

/** POST|DELETE /songs/[songId]/patterns/[pattern]/vote */
