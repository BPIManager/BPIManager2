import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

export async function handleRankingSongById(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  const songIdNum = parseInt(req.query.songId as string);
  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  try {
    const result = await statsTablesRepo.getSongRanking(
      songIdNum,
      resolveVersion(req.query.version),
      viewerId,
    );
    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/ranking/songs */
