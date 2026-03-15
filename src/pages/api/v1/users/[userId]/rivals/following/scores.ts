import { logsRepo } from "@/lib/db/logs";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method Not Allowed" });

  const {
    version,
    limit,
    lastDiff,
    lastSongId,
    lastRivalId,
    levels,
    difficulties,
    minDiff,
    maxDiff,
  } = req.query;

  const userId = req.authUid;

  if (!userId || !version) {
    return res.status(400).json({ message: "userId and version are required" });
  }

  try {
    const normalize = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    const levelArray = normalize(levels).map(Number);
    const diffArray = normalize(difficulties);
    const nMin = minDiff !== undefined ? Number(minDiff) : 1;
    const nMax = maxDiff !== undefined ? Number(maxDiff) : 30;
    const nLimit = limit ? Number(limit) : 10;

    const cursor =
      lastDiff && lastSongId && lastRivalId
        ? {
            lastDiff: Number(lastDiff),
            lastSongId: String(lastSongId),
            lastRivalId: String(lastRivalId),
          }
        : undefined;

    const rawResults = await logsRepo.getScoreComparisonList({
      userId: String(userId),
      version: String(version),
      limit: nLimit,
      minDiff: nMin,
      maxDiff: nMax,
      cursor,
      levelArray,
      diffArray,
    });
    const items = rawResults.map((row) => {
      const item = {
        songId: Number(row.songId),
        title: row.title,
        notes: Number(row.notes),
        bpm: row.bpm,
        difficulty: row.difficulty,
        difficultyLevel: Number(row.difficultyLevel),
        releasedVersion: row.releasedVersion
          ? Number(row.releasedVersion)
          : null,

        logId: row.logId ? Number(row.logId) : null,
        exScore: row.exScore !== null ? Number(row.exScore) : null,
        bpi: row.bpi !== null ? Number(row.bpi) : null,
        clearState: row.clearState || "NO PLAY",
        missCount: row.missCount !== null ? Number(row.missCount) : null,
        scoreAt: row.scoreAt || null,

        wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
        kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
        coef: row.coef !== null ? Number(row.coef) : null,

        exDiff: Number(row.exDiff),
      };

      return {
        ...item,
        rival: {
          userId: row.rivalId,
          userName: row.rivalName,
          profileImage: row.rivalImage,
          exScore: Number(row.rivalEx),
        },
      };
    });

    const lastItem = rawResults[rawResults.length - 1];
    const nextCursor = lastItem
      ? {
          lastDiff: Number(lastItem.exDiff),
          lastSongId: String(lastItem.songId),
          lastRivalId: String(lastItem.rivalId),
        }
      : null;

    return res.status(200).json({
      items,
      nextCursor,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

export default withAuth(handler);
