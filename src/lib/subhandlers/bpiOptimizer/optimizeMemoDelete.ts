import type { NextApiRequest } from "next";
import { bpiOptimizerRepo } from "@/lib/db/domains/bpiOptimizer";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleDeleteOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ deleted: true }>> {
  const uid = authUidOf(req);
  const rid = String(req.query.memoId);
  try {
    const success = await bpiOptimizerRepo.deleteMemo(uid, rid);
    if (!success) {
      return {
        result: err(404, "Memo not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ deleted: true }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}
