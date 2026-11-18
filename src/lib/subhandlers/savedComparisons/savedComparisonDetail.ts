import type { NextApiRequest } from "next";
import { savedComparisonsRepo } from "@/lib/db/domains/savedComparisons";
import { err, ok, invalidBody } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { updateSavedComparisonBodySchema } from "@/schemas/savedComparisons";
import { authUidOf, type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";

function parseId(req: NextApiRequest): number | null {
  return parseIntParam("id", req.query.id);
}

/** PATCH /users/[userId]/saved-comparisons/[id] */
export async function handleUpdateSavedComparison(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseId(req);
  if (id === null) {
    return { result: invalidParam("id", req.query.id, "Invalid id"), targetUserId: uid, viewerId: uid };
  }
  const parsed = updateSavedComparisonBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: invalidBody(parsed.error, updateSavedComparisonBodySchema),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const updated = await savedComparisonsRepo.update(id, uid, {
      name: parsed.data.name,
      targetsJson: parsed.data.targets ? JSON.stringify(parsed.data.targets) : undefined,
    });
    if (!updated) {
      return { result: err(404, "Not found"), targetUserId: uid, viewerId: uid };
    }
    return { result: ok({ status: "updated" }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}

/** DELETE /users/[userId]/saved-comparisons/[id] */
export async function handleDeleteSavedComparison(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseId(req);
  if (id === null) {
    return { result: invalidParam("id", req.query.id, "Invalid id"), targetUserId: uid, viewerId: uid };
  }
  try {
    const deleted = await savedComparisonsRepo.delete(id, uid);
    if (!deleted) {
      return { result: err(404, "Not found"), targetUserId: uid, viewerId: uid };
    }
    return { result: ok({ status: "deleted" }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}
