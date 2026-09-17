import type { NextApiRequest } from "next";
import { bpiOptimizerRepo } from "@/lib/db/domains/bpiOptimizer";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createOptimizeMemoBodySchema } from "@/schemas/optimizeMemo/create";
import { authUidOf, type HandleOutcome } from "./_shared";

/** DELETE /users/[userId]/optimizeMemo/[memoId] （withAuth） */
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

/**
 * PUT /users/[userId]/optimizeMemo/[memoId] （withAuth）
 *
 * 保存済みの目標（自動生成・カスタムのどちらも）の曲目・目標BPIを
 * 上書き更新する。「目標管理」の編集機能から使う。
 */
export async function handleUpdateOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ updated: true }>> {
  const uid = authUidOf(req);
  const rid = String(req.query.memoId);
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
    const success = await bpiOptimizerRepo.updateMemo(
      uid,
      rid,
      parsed.data.targetBpi,
      parsed.data.reportData,
      parsed.data.kind ?? "auto",
    );
    if (!success) {
      return {
        result: err(404, "Memo not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ updated: true }),
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
