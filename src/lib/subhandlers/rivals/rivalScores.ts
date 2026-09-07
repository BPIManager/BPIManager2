import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { sortSongs } from "@/utils/songs/sort";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { rivalScoresQuerySchema } from "@/schemas/rivals/query";
import { rivalScoreDetailQuerySchema } from "@/schemas/rivals/rivalId/scores/query";
import { radarLookup, targetOf, type HandleOutcome } from "./_shared";


export async function handleRivalScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, version, ...filterParams } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const rivalAccess = await checkProfileAccess(req, rivalId);
    const rivalDenied = accessError(rivalAccess);
    if (rivalDenied) return { result: rivalDenied, targetUserId, viewerId };

    const rawResults = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId,
      version,
    });

    const compared = rawResults
      .map((row) => {
        const myEx = row.myExScore !== null ? Number(row.myExScore) : null;
        const rivalEx =
          row.rivalExScore !== null ? Number(row.rivalExScore) : null;
        const myBpi = row.myBpi !== null ? Number(row.myBpi) : null;
        const rivalBpi = row.rivalBpi !== null ? Number(row.rivalBpi) : null;

        const exDiff = (myEx ?? 0) - (rivalEx ?? 0);
        const bpiDiff =
          Math.round(((myBpi ?? -15) - (rivalBpi ?? -15)) * 100) / 100;

        return {
          songId: row.songId,
          title: row.title || "Unknown Title",
          notes: Number(row.notes || 0),
          bpm: row.bpm || "0",
          difficulty: row.difficulty || "ANOTHER",
          difficultyLevel: Number(row.difficultyLevel || 12),
          releasedVersion: row.releasedVersion || 0,
          wrScore: row.wrScore || null,
          kaidenAvg: row.kaidenAvg || null,
          coef: row.coef || null,

          logId: row.myLogId ? Number(row.myLogId) : null,
          exScore: myEx,
          bpi: myBpi,
          clearState: row.myClearState || "NO PLAY",
          missCount: row.myMissCount !== null ? Number(row.myMissCount) : null,
          scoreAt: row.myLastPlayed || null,

          rival: {
            userId: row.rivalUserId,
            userName: row.rivalUserName,
            exScore: rivalEx,
            bpi: rivalBpi,
            clearState: row.rivalClearState || "NO PLAY",
            missCount:
              row.rivalMissCount !== null ? Number(row.rivalMissCount) : null,
            lastPlayed: row.rivalLastPlayed || null,
          },

          exDiff,
          bpiDiff,
          lastPlayedMax:
            row.myLastPlayed && row.rivalLastPlayed
              ? new Date(row.myLastPlayed) > new Date(row.rivalLastPlayed)
                ? row.myLastPlayed
                : row.rivalLastPlayed
              : row.myLastPlayed || row.rivalLastPlayed || null,
          radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
        };
      })
      .filter(
        (song) => song.exScore !== null || song.rival.exScore !== null,
      );

    const sorted = sortSongs(compared, filterParams);
    return { result: ok(sorted), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/[rivalId]/scores/[songId] （withUserApiHandler） */
export async function handleRivalScoreDetail(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalScoreDetailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, songId, version } = parsed.data;

  try {
    const rivalAccess = await checkProfileAccess(req, String(rivalId));
    const viewerId = rivalAccess.viewerId ?? null;
    const denied = accessError(rivalAccess);
    if (denied) return { result: denied, targetUserId, viewerId };

    const result = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId: String(rivalId),
      version,
    });
    const rivalData = result.find((r) => r.songId === Number(songId));
    if (!rivalData) {
      return {
        result: err(404, "Rival score not found"),
        targetUserId,
        viewerId,
      };
    }

    return {
      result: ok({
        songId: Number(songId),
        version: String(version),
        rival: {
          userId: rivalData.rivalUserId ?? null,
          userName: rivalData.rivalUserName ?? null,
          profileImage: null,
          exScore: rivalData.rivalExScore,
          bpi: rivalData.rivalBpi !== null ? Number(rivalData.rivalBpi) : -15.0,
          clearState: rivalData.rivalClearState,
          lastPlayed: rivalData.rivalLastPlayed,
          metadata: {
            wrScore: rivalData.wrScore,
            kaidenAvg: rivalData.kaidenAvg,
          },
        },
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

