import type { NextApiRequest } from "next";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

/** GET /users/[userId]/scores/best-ever */
export async function handleBestEver(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { currentVersion, excludeCurrent } = req.query;
  if (!currentVersion || typeof currentVersion !== "string") {
    return {
      result: err(400, "Missing or invalid currentVersion parameter."),
      targetUserId,
      viewerId,
    };
  }

  try {
    const rows = await timelineRepo.getBestEverScores({
      userId: targetUserId,
      currentVersion,
      excludeCurrent: excludeCurrent === "true",
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
    }));

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/self-version */
