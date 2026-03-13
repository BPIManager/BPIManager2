import { LogRepository } from "@/lib/db/logs";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const {
    userId,
    version,
    limit,
    lastDiff,
    lastSongId,
    lastRivalId,
    levels,
    difficulties,
  } = req.query;

  if (!userId || !version) {
    return res.status(400).json({ message: "userId and version are required" });
  }

  const repo = new LogRepository();
  const nLimit = limit ? Number(limit) : 10;

  try {
    const access = await checkUserAccess(req, String(userId));
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const normalize = (val: string | string[] | undefined): string[] => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    const levelArray = normalize(levels).map(Number);
    const diffArray = normalize(difficulties);

    const cursor =
      lastDiff && lastSongId && lastRivalId
        ? {
            lastDiff: Number(lastDiff),
            lastSongId: String(lastSongId),
            lastRivalId: String(lastRivalId),
          }
        : undefined;

    const rawResults = await repo.getNearWinList({
      userId: String(userId),
      version: String(version),
      limit: nLimit,
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
}
