import { allScoresRepo } from "@/lib/db/domains/allScores";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandleOutcome, AllSongRanking } from "./_shared";

export async function handleAllSongRanking(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<AllSongRanking>> {
  const viewerId = req.authUid;
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : viewerId;
  const songIdNum = parseInt(req.query.songId as string);

  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  try {
    const result = await allScoresRepo.getAllSongRanking(
      songIdNum,
      resolveVersion(req.query.version),
      viewerId,
    );
    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/all-scores/[songId]/rivals （withUserApiHandler） */
