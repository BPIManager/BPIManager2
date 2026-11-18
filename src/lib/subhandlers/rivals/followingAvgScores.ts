import type { NextApiRequest } from "next";
import { rivalAggregateRepo } from "@/lib/db/aggregates/rivalScores/aggregate";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";
import { parseInput } from "@/lib/validation/parse";
import { versionQuerySchema } from "@/schemas/common/query";

export async function handleRivalFollowingAvgScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };

  const { songIds: songIdsRaw } = req.query;
  const q = parseInput(versionQuerySchema, req.query, {
    in: "query",
    message: "userId and version are required",
  });
  if (!q.success) {
    return { result: q.result, ...base };
  }
  const { version } = q.data;
  const songIds =
    songIdsRaw && typeof songIdsRaw === "string"
      ? songIdsRaw
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

  try {
    const rows = await rivalAggregateRepo.getRivalAvgScores({
      userId,
      version,
      songIds,
    });
    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      avgExScore: row.avgExScore !== null ? Number(row.avgExScore) : null,
      avgBpi: row.avgBpi !== null ? Number(row.avgBpi) : null,
      rivalCount: Number(row.rivalCount),
    }));
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /users/[userId]/rivals/following/list */
