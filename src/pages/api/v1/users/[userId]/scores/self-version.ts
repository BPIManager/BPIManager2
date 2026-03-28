import { NextApiRequest, NextApiResponse } from "next";
import { logsRepo } from "@/lib/db/logs";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";

async function handleGetSelfVersion(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
) {
  const { currentVersion, targetVersion } = req.query;

  if (!currentVersion || typeof currentVersion !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid currentVersion parameter." });
  }
  if (!targetVersion || typeof targetVersion !== "string") {
    return res
      .status(400)
      .json({ message: "Missing or invalid targetVersion parameter." });
  }
  if (currentVersion === targetVersion) {
    return res
      .status(400)
      .json({ message: "currentVersion and targetVersion must differ." });
  }

  const rows = await logsRepo.getSelfVersionScores({
    userId,
    currentVersion,
    targetVersion,
  });

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
    };
  });

  return res.status(200).json(result);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    switch (req.method) {
      case "GET":
        return await handleGetSelfVersion(req, res, userId);
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
