import type { NextApiRequest } from "next";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { deleteBatch } from "@/lib/db/orchestrators/batchDeletion";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchDetailDeleteQuerySchema } from "@/schemas/batches/query";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleBatchDelete(
  req: NextApiRequest,
): Promise<HandleOutcome<{ message: string }>> {
  const parsed = batchDetailDeleteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const { userId: uid, batchId: bid } = parsed.data;

  try {
    const viewerId = (await authenticateViewer(req)) ?? null;
    if (!viewerId || viewerId !== uid) {
      return { result: err(403, "Forbidden"), targetUserId: uid, viewerId };
    }

    const targetBatch = await navigationRepo.findBatchByIdAndUser(bid, uid);
    if (!targetBatch) {
      return {
        result: err(404, "Batch not found."),
        targetUserId: uid,
        viewerId,
      };
    }

    await deleteBatch(uid, bid);

    return {
      result: ok({ message: "Batch deleted successfully." }),
      targetUserId: uid,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

