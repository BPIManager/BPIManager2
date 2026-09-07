import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";
export async function handleSongPatternSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songId = num(req.query.songId);
  if (songId === null) return { result: err(400, "Invalid songId"), ...base };

  const q = req.query.q;
  if (!q || Array.isArray(q) || !/^\d{7}$/.test(q)) {
    return { result: err(400, "Invalid pattern"), ...base };
  }
  const result = await songPatternsRepo.searchPattern(songId, q);
  if (!result) return { result: ok(null), ...base };
  return { result: ok(result), ...base };
}

/** POST|DELETE /songs/[songId]/patterns/[pattern]/vote */
