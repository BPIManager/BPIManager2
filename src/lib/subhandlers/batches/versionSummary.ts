import type { NextApiRequest } from "next";
import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { scoresRepo } from "@/lib/db/domains/scores";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";

const versionSummaryQuerySchema = z.object({
  userId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
});

/** GET /users/[userId]/batches/version-summary */
export async function handleVersionSummary(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const parsed = versionSummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const { userId, version } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: userId, viewerId };

    const compareVersion = await scoresRepo.getPreviousVersionWithScores(
      userId,
      version,
    );

    if (!compareVersion) {
      return {
        result: ok({
          songs: [],
          currentVersion: version,
          compareVersion: null,
          compareVersionLabel: null,
        }),
        targetUserId: userId,
        viewerId,
      };
    }

    const rows = await timelineRepo.getSelfVersionScores({
      userId,
      currentVersion: version,
      targetVersion: compareVersion,
    });

    const songs = rows.map((row) => {
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

      const exDiff =
        myEx !== null && prevEx !== null
          ? myEx - prevEx
          : myEx !== null
            ? myEx
            : 0;
      const bpiDiff =
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : myBpi !== null
            ? Math.round((myBpi + 15) * 100) / 100
            : 0;

      return {
        songId: Number(row.songId),
        title: row.title,
        notes: Number(row.notes),
        bpm: row.bpm,
        difficulty: row.difficulty,
        difficultyLevel: Number(row.difficultyLevel),
        level: Number(row.difficultyLevel),
        releasedVersion: row.releasedVersion
          ? Number(row.releasedVersion)
          : null,
        current:
          myEx !== null
            ? {
                exScore: myEx,
                bpi: myBpi ?? -15,
                clearState: row.myClearState ?? null,
                missCount:
                  row.myMissCount !== null && row.myMissCount !== undefined
                    ? Number(row.myMissCount)
                    : null,
                lastPlayedAt: row.myLastPlayed ?? null,
              }
            : null,
        previous:
          prevEx !== null
            ? {
                exScore: prevEx,
                bpi: prevBpi ?? -15,
                clearState: row.prevClearState ?? null,
                missCount:
                  row.prevMissCount !== null && row.prevMissCount !== undefined
                    ? Number(row.prevMissCount)
                    : null,
              }
            : null,
        diff: { exScore: exDiff, bpi: bpiDiff },
        wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
        kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
        coef: row.coef !== null ? Number(row.coef) : null,
        overtaken: [],
        rivalRankInfo: null,
      };
    });

    return {
      result: ok({
        songs,
        currentVersion: version,
        compareVersion,
        compareVersionLabel: getVersionNameFromNumber(compareVersion),
      }),
      targetUserId: userId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId: null,
    };
  }
}
