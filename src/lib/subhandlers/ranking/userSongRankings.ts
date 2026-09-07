import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

export async function handleUserSongRankings(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<{ songs: unknown }>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  try {
    const songs = await statsTablesRepo.getUserSongRankings(
      viewerId,
      resolveVersion(req.query.version),
    );
    return { result: ok({ songs }), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/ranking/tower */
