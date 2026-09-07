import { allScoresAggregateRepo } from "@/lib/db/aggregates/allScores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { NextApiRequest } from "next";
import type { HandleOutcome, AllSongRanking, AllSongRivalsBody } from "./_shared";

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
export async function handleAllSongRivals(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<AllSongRivalsBody>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  const viewerId = access.viewerId ?? null;
  const { songId } = req.query;

  if (!targetUserId || !songId) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId,
    };
  }

  const version = resolveVersion(req.query.version);
  const rivalsScores = await allScoresAggregateRepo.getRivalScoresForAllSong({
    viewerId: targetUserId,
    songId: Number(songId),
    version,
  });

  return {
    result: ok({
      songId: Number(songId),
      version,
      rivals: rivalsScores.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        exScore: r.exScore,
        bpi: r.bpi !== null ? Number(r.bpi) : null,
        clearState: r.clearState,
        lastPlayed: r.lastPlayed,
      })),
    }),
    targetUserId,
    viewerId,
  };
}
