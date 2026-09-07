import type { NextApiRequest } from "next";
import { bpiOptimizerRepo } from "@/lib/db/domains/bpiOptimizer";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createOptimizeMemoBodySchema } from "@/schemas/optimizeMemo/create";
import { authUidOf, targetOf, type HandleOutcome } from "./_shared";

export async function handleOptimizeMemoList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = targetOf(req);
  try {
    const access = await checkUserAccess(req, uid);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: uid, viewerId };

    const memos = await bpiOptimizerRepo.getMemosByUserId(uid);
    return { result: ok(memos), targetUserId: uid, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

/** POST /users/[userId]/optimizeMemo （withAuth、v1 は 201） */
export async function handleCreateOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ reportId: unknown }>> {
  const uid = authUidOf(req);
  const parsed = createOptimizeMemoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const reportId = await bpiOptimizerRepo.saveMemo(
      uid,
      parsed.data.targetBpi,
      parsed.data.reportData,
    );
    return { result: ok({ reportId }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** DELETE /users/[userId]/optimizeMemo/[memoId] （withAuth、v1 は 204） */
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
