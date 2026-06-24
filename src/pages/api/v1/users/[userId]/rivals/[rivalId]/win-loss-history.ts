import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { IIDX_VERSIONS } from "@/constants/iidx/latestVersion";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { rejectAccess } from "@/middlewares/api/withApi";
import { socialComparisonRepo } from "@/lib/db/social/comparison";
import dayjs from "@/lib/dayjs";
import { parseQuery } from "@/services/nextRequest/parseBody";

const querySchema = z.object({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
  level: z.coerce
    .number()
    .int()
    .refine((v) => v === 11 || v === 12),
});

type Outcome = "win" | "lose" | "draw" | null;

function getOutcome(viewer: number | null, rival: number | null): Outcome {
  if (viewer === null || rival === null) return null;
  if (viewer > rival) return "win";
  if (viewer < rival) return "lose";
  return "draw";
}

function outcomeDelta(outcome: Outcome): number {
  if (outcome === "win") return 1;
  if (outcome === "lose") return -1;
  return 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const query = parseQuery(querySchema, req.query, res);
  if (!query) return;
  const { userId, rivalId, version, level } = query;

  try {
    const access = await checkProfileAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const rivalAccess = await checkProfileAccess(req, rivalId);
    if (!rivalAccess.hasAccess) return rejectAccess(res, rivalAccess);

    const viewerId = access.viewerId;
    if (!viewerId) return res.status(401).json({ message: "Unauthorized" });

    const rows = await socialComparisonRepo.getWinLossHistory(
      viewerId,
      rivalId,
      version,
      level,
    );

    if (rows.length === 0) return res.status(200).json([]);

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

        if (update.userId === viewerId) {
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

    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
