import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleRivalFollowingTopScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };
  const { version, songIds: songIdsRaw } = req.query;
  if (!version || typeof version !== "string") {
    return { result: err(400, "userId and version are required"), ...base };
  }
  const songIds =
    songIdsRaw && typeof songIdsRaw === "string"
      ? songIdsRaw
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

  try {
    const rows = await rivalRepo.getRivalTopScores({
      userId,
      version,
      songIds,
    });
    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      topExScore: row.topExScore !== null ? Number(row.topExScore) : null,
      topBpi: row.topBpi !== null ? Number(row.topBpi) : null,
      rivalCount: Number(row.rivalCount),
    }));
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /users/[userId]/rivals/suggestions （withAuth） */
