import type { NextApiRequest } from "next";
import { z } from "zod";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";



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
