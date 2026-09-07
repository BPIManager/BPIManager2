import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { rivalFollowingScoresQuerySchema } from "@/schemas/rivals/following/scores/query";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleRivalFollowingScoresForSong(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalFollowingScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, songId, version } = parsed.data;

  try {
    const rivalsScores = await rivalRepo.getFollowedScoresForSong({
      viewerId: String(userId),
      songId: Number(songId),
      version,
    });
    return {
      result: ok({
        songId: Number(songId),
        version: String(version),
        rivals: rivalsScores.map(formatRivalScore),
      }),
      targetUserId,
      viewerId: targetUserId || null,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

export const formatRivalScore = (
  r: Awaited<ReturnType<typeof rivalRepo.getFollowedScoresForSong>>[number],
) => ({
  userId: r.userId,
  userName: r.userName,
  profileImage: r.profileImage,
  exScore: r.exScore,
  bpi: r.bpi !== null ? Number(r.bpi) : -15.0,
  clearState: r.clearState,
  lastPlayed: r.lastPlayed,
  metadata: {
    wrScore: r.wrScore,
    kaidenAvg: r.kaidenAvg,
  },
});

/** GET /users/[userId]/rivals/following/summary （withAuth） */
