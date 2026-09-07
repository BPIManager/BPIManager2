import type { NextApiRequest } from "next";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleRivalFollowingList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  if (!targetUserId) {
    return {
      result: err(400, "userId is required"),
      targetUserId,
      viewerId: null,
    };
  }
  try {
    const access = await checkUserAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    if (!access.user) {
      return { result: err(401, "Unauthorized"), targetUserId, viewerId };
    }
    const rivals =
      await followListAggregateRepo.getPublicFollowingUsers(targetUserId);
    return { result: ok({ rivals }), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/following/monthly-review-summary */
