import type { NextApiRequest } from "next";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchRadarGrowthQuerySchema } from "@/schemas/batches/radarGrowth";
import { calculateRadar } from "@/lib/radar/calculator";
import { buildBeforeScores, buildRadarGrowthSnapshot } from "@/lib/radar/growth";
import { targetOf, type HandleOutcome } from "./_shared";
import { loadRadarGrowthContext } from "./_radarGrowth";

/** GET /users/[userId]/batches/[batchId]/radar-growth */
export async function handleBatchRadarGrowth(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  try {
    const loaded = await loadRadarGrowthContext(req, batchRadarGrowthQuerySchema);
    if ("outcome" in loaded) return loaded.outcome;
    const { query, viewerId, afterScores, periodScores, master, validSongKeys } =
      loaded.context;

    const after = calculateRadar(afterScores, master, validSongKeys);
    const before = calculateRadar(
      buildBeforeScores(afterScores, periodScores),
      master,
      validSongKeys,
    );

    return {
      result: ok(buildRadarGrowthSnapshot(before, after)),
      targetUserId: query.userId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
}
