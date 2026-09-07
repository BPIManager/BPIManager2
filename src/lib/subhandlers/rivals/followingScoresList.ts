import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { scoreComparisonQuerySchema } from "@/schemas/rivals/following/scores/query";
import { authUidOf, normalizeArr, type HandleOutcome } from "./_shared";

export async function handleRivalFollowingScoresList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };

  const parsed = scoreComparisonQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      ...base,
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
    };
  }
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
  } = parsed.data;

  try {
    const levelArray = normalizeArr(levels as unknown as string[]).map(Number);
    const diffArray = normalizeArr(difficulties as unknown as string[]);
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

    const rawResults = await rivalRepo.getScoreComparisonList({
      userId: String(userId),
      version,
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

    return { ...base, result: ok({ items, nextCursor }) };
  } catch (error: unknown) {
    return { ...base, result: err(500, toErrorMessage(error)) };
  }
}

/** GET /users/[userId]/rivals/following/scores/[songId] （withUserApiHandler） */
