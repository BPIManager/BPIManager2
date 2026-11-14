import type { NextApiRequest } from "next";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchRadarGrowthSongsQuerySchema } from "@/schemas/batches/radarGrowth";
import { buildCategorySongImpacts } from "@/lib/radar/growth";
import { targetOf, type HandleOutcome } from "./_shared";
import { loadRadarGrowthContext } from "./_radarGrowth";

/** GET /users/[userId]/batches/[batchId]/radar-growth-songs */
export async function handleBatchRadarGrowthSongs(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  try {
    const loaded = await loadRadarGrowthContext(req, batchRadarGrowthSongsQuerySchema);
    if ("outcome" in loaded) return loaded.outcome;
    const { query, viewerId, afterScores, periodScores, master, validSongKeys } =
      loaded.context;

    const songs = buildCategorySongImpacts(
      query.category,
      afterScores,
      periodScores,
      master,
      validSongKeys,
    );

    return {
      result: ok({ category: query.category, songs }),
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
