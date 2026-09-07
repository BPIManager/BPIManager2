import type { NextApiRequest } from "next";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { selfVersionComparisonQuerySchema } from "@/schemas/scores/query";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { radarLookup, targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

export async function handleSelfVersion(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = selfVersionComparisonQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { currentVersion, targetVersion } = parsed.data;

  let rows: Awaited<ReturnType<typeof timelineRepo.getSelfVersionScores>>;
  try {
    rows = await timelineRepo.getSelfVersionScores({
      userId: targetUserId,
      currentVersion,
      targetVersion,
    });
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }

  const result = rows.map((row) => {
    const myEx =
      row.myExScore !== null && row.myExScore !== undefined
        ? Number(row.myExScore)
        : null;
    const prevEx =
      row.prevExScore !== null && row.prevExScore !== undefined
        ? Number(row.prevExScore)
        : null;
    const myBpi =
      row.myBpi !== null && row.myBpi !== undefined ? Number(row.myBpi) : null;
    const prevBpi =
      row.prevBpi !== null && row.prevBpi !== undefined
        ? Number(row.prevBpi)
        : null;

    return {
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      logId: null,
      exScore: myEx,
      bpi: myBpi,
      clearState: row.myClearState ?? null,
      missCount:
        row.myMissCount !== null && row.myMissCount !== undefined
          ? Number(row.myMissCount)
          : null,
      scoreAt: row.myLastPlayed ?? null,

      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
      rival: {
        exScore: prevEx,
        bpi: prevBpi,
        clearState: row.prevClearState ?? null,
        missCount:
          row.prevMissCount !== null && row.prevMissCount !== undefined
            ? Number(row.prevMissCount)
            : null,
        lastPlayed: row.prevLastPlayed ?? null,
      },

      exDiff: myEx !== null && prevEx !== null ? myEx - prevEx : undefined,
      bpiDiff:
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : undefined,
      radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
    };
  });

  return { result: ok(result), targetUserId, viewerId };
}

/** GET /users/[userId]/scores/unplayed */
