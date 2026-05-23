import { NextApiRequest, NextApiResponse } from "next";
import { timelineRepo, navigationRepo } from "@/lib/db/logs";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { rejectAccess } from "@/middlewares/api/withApi";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { getVersionNameFromNumber } from "@/constants/versions";

const versionSummaryQuerySchema = z.object({
  userId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  const query = parseQuery(versionSummaryQuerySchema, req.query, res);
  if (!query) return;
  const { userId, version } = query;

  try {
    const access = await checkProfileAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const compareVersion = await navigationRepo.getPreviousVersionWithScores(
      userId,
      version,
    );

    if (!compareVersion) {
      return res.status(200).json({
        songs: [],
        currentVersion: version,
        compareVersion: null,
        compareVersionLabel: null,
      });
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
        row.myBpi !== null && row.myBpi !== undefined
          ? Number(row.myBpi)
          : null;
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

    return res.status(200).json({
      songs,
      currentVersion: version,
      compareVersion,
      compareVersionLabel: getVersionNameFromNumber(compareVersion),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}
