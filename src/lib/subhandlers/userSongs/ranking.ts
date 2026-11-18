import { statsSongTablesRepo } from "@/lib/db/aggregates/stats/songTables";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { NextApiRequest } from "next";
import { targetOf, type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";

/** GET /users/[userId]/songs/[songId]/ranking */
export async function handleUserSongRanking(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const songIdNum = parseIntParam("songId", req.query.songId);
  if (songIdNum === null) {
    return { result: invalidParam("songId", req.query.songId, "Invalid songId"), targetUserId, viewerId };
  }

  const result = await statsSongTablesRepo.getSongRanking(
    songIdNum,
    resolveVersion(req.query.version),
    access.user!.userId,
  );
  return { result: ok(result), targetUserId, viewerId };
}
