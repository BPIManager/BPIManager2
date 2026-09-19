import type { NextApiRequest } from "next";
import { scoreTimelineRepo } from "@/lib/db/aggregates/scoreTimeline";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchesQuerySchema } from "@/schemas/batches/query";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

/** GET /users/[userId]/batches （withUserApiHandler） */
export async function handleBatchesList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = batchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { userId, version, groupedBy, topN } = parsed.data;

  try {
    if (groupedBy === "lastPlayed") {
      const [history, batchTotalBpis] = await Promise.all([
        statsTablesRepo.getScoreHistory(userId, version, [], []),
        navigationRepo.getBatchTotalBpiHistory(userId, version),
      ]);
      const timeline = calculateTotalBpi(history, batchTotalBpis, version, topN);
      return { result: ok(timeline), targetUserId, viewerId };
    }

    const timeline = await scoreTimelineRepo.getTimelineByBatches({
      userId,
      version,
      topN,
    });
    return { result: ok(timeline), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
