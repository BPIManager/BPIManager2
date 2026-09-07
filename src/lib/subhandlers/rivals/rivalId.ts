import type { NextApiRequest } from "next";
import { z } from "zod";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
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


const winLossHistoryQuerySchema = z.object({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
  level: z.coerce
    .number()
    .int()
    .refine((v) => v === 11 || v === 12),
});
type WlOutcome = "win" | "lose" | "draw" | null;
function getOutcome(viewer: number | null, rival: number | null): WlOutcome {
  if (viewer === null || rival === null) return null;
  if (viewer > rival) return "win";
  if (viewer < rival) return "lose";
  return "draw";
}
function outcomeDelta(outcome: WlOutcome): number {
  if (outcome === "win") return 1;
  if (outcome === "lose") return -1;
  return 0;
}

/** GET /users/[userId]/rivals/[rivalId]/win-loss-history */
export async function handleRivalWinLossHistory(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = winLossHistoryQuerySchema.safeParse(req.query);
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
  const { userId, rivalId, version, level } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const rivalAccess = await checkProfileAccess(req, rivalId);
    const rivalDenied = accessError(rivalAccess);
    if (rivalDenied) return { result: rivalDenied, targetUserId, viewerId };

    const rows = await socialComparisonRepo.getWinLossHistory(
      userId,
      rivalId,
      version,
      level,
    );
    if (rows.length === 0) return { result: ok([]), targetUserId, viewerId };

    const toJSTDate = (date: Date | string) =>
      dayjs(date).tz().format("YYYY-MM-DD");

    const byDate = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!row.lastPlayed) continue;
      const date = toJSTDate(row.lastPlayed);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(row);
    }

    const sortedDates = Array.from(byDate.keys()).sort();
    const songState = new Map<
      number,
      { viewer: number | null; rival: number | null }
    >();
    let cumulative = 0;
    const result: { date: string; delta: number; cumulative: number }[] = [];

    for (const date of sortedDates) {
      const updates = byDate.get(date)!;
      let dailyDelta = 0;
      for (const update of updates) {
        const state = songState.get(update.songId) ?? {
          viewer: null,
          rival: null,
        };
        const oldOutcome = getOutcome(state.viewer, state.rival);
        if (update.userId === userId) {
          state.viewer = update.exScore;
        } else {
          state.rival = update.exScore;
        }
        songState.set(update.songId, state);
        const newOutcome = getOutcome(state.viewer, state.rival);
        dailyDelta += outcomeDelta(newOutcome) - outcomeDelta(oldOutcome);
      }
      cumulative += dailyDelta;
      result.push({ date, delta: dailyDelta, cumulative });
    }

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/following/avg-scores （withAuth） */
