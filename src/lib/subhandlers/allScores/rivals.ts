import { allScoresAggregateRepo } from "@/lib/db/aggregates/allScores";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { NextApiRequest } from "next";
import type { HandleOutcome, AllSongRivalsBody } from "./_shared";

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
