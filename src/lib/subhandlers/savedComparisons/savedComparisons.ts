import type { NextApiRequest } from "next";
import { savedComparisonsRepo } from "@/lib/db/domains/savedComparisons";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createSavedComparisonBodySchema } from "@/schemas/savedComparisons";
import {
  authUidOf,
  canViewerSeeUser,
  maskInaccessibleTargets,
  parseStoredTargets,
  type HandleOutcome,
} from "./_shared";

/** GET /users/[userId]/saved-comparisons */
export async function handleSavedComparisonsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const rows = await savedComparisonsRepo.getAllForUser(uid);
    const comparisons = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        name: r.name,
        targets: await maskInaccessibleTargets(
          uid,
          parseStoredTargets(r.targets),
          (targetId) => canViewerSeeUser(uid, targetId),
        ),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    );
    return { result: ok({ comparisons }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}

/** POST /users/[userId]/saved-comparisons */
export async function handleCreateSavedComparison(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const parsed = createSavedComparisonBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const id = await savedComparisonsRepo.create(
      uid,
      parsed.data.name,
      JSON.stringify(parsed.data.targets),
    );
    return { result: ok({ id }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}
