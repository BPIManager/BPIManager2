import type { NextApiRequest } from "next";
import { z } from "zod";
import { iidxTowerRepo } from "@/lib/db/domains/iidxTower";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

const towerRowSchema = z.object({
  playDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keyCount: z.number().int().nonnegative(),
  scratchCount: z.number().int().nonnegative(),
});
const postBodySchema = z.object({
  version: z.string().min(1).max(50),
  rows: z.array(towerRowSchema).min(1).max(1000),
});

function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/** GET /users/[userId]/iidx-tower */
export async function handleIidxTowerGet(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  try {
    const access = await checkProfileAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const version =
      typeof req.query.version === "string" ? req.query.version : undefined;
    const compare = req.query.compare === "true";

    const targetData = await iidxTowerRepo.getByUser(targetUserId, version);

    if (!compare) {
      return { result: ok(targetData), targetUserId, viewerId };
    }

    if (!access.viewerId) {
      return {
        result: err(401, "Authentication required for compare mode."),
        targetUserId,
        viewerId,
      };
    }

    const selfData =
      access.viewerId === targetUserId
        ? targetData
        : await iidxTowerRepo.getByUser(access.viewerId, version);

    return {
      result: ok({ target: targetData, self: selfData }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** POST /users/[userId]/iidx-tower （withAuth、本人のみ） */
export async function handleIidxTowerPost(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = (req as AuthenticatedNextApiRequest).authUid;
  const parsed = postBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, "Invalid request body"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const count = await iidxTowerRepo.upsertRows(
      uid,
      parsed.data.version,
      parsed.data.rows,
    );
    return {
      result: ok({ success: true, upsertedCount: count }),
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
