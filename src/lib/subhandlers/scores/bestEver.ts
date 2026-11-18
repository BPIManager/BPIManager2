import type { NextApiRequest } from "next";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";
import { parseInput } from "@/lib/validation/parse";
import { currentVersionQuerySchema } from "@/schemas/common/query";

/** GET /users/[userId]/scores/best-ever */
export async function handleBestEver(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { excludeCurrent, difficultyLevel } = req.query;
  const q = parseInput(currentVersionQuerySchema, req.query, {
    in: "query",
    message: "Missing or invalid currentVersion parameter.",
  });
  if (!q.success) {
    return { result: q.result, targetUserId, viewerId };
  }
  const { currentVersion } = q.data;
  const parsedDifficultyLevel =
    typeof difficultyLevel === "string" && difficultyLevel !== ""
      ? Number(difficultyLevel)
      : undefined;

  try {
    const rows = await timelineRepo.getBestEverScores({
      userId: targetUserId,
      currentVersion,
      excludeCurrent: excludeCurrent === "true",
      difficultyLevel: Number.isFinite(parsedDifficultyLevel)
        ? parsedDifficultyLevel
        : undefined,
    });

    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      bestExScore: row.bestExScore !== null ? Number(row.bestExScore) : null,
      bestBpi: row.bestBpi !== null ? Number(row.bestBpi) : null,
      bestVersion: row.bestVersion ?? null,
      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
      mu: row.mu !== null ? Number(row.mu) : null,
      sigma: row.sigma !== null ? Number(row.sigma) : null,
      residualVar: row.residualVar !== null ? Number(row.residualVar) : null,
    }));

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/self-version */
