import { allScoresSelfRivalRepo } from "@/lib/db/aggregates/allScores/selfAndRivals";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { NextApiRequest } from "next";
import type { HandleOutcome, AllSongRivalsBody } from "./_shared";
import { parseInput } from "@/lib/validation/parse";
import { pathParamsSchema } from "@/schemas/common/params";

export async function handleAllSongRivals(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<AllSongRivalsBody>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  const viewerId = access.viewerId ?? null;

  const path = parseInput(pathParamsSchema("userId", "songId"), req.query, {
    in: "path",
    message: "Missing required parameters",
  });
  if (!path.success) {
    return { result: path.result, targetUserId, viewerId };
  }
  const { songId } = path.data;

  const version = resolveVersion(req.query.version);
  const rivalsScores = await allScoresSelfRivalRepo.getRivalScoresForAllSong({
    viewerId: targetUserId,
    songId,
    version,
  });

  return {
    result: ok({
      songId,
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
