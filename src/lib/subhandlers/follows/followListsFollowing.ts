import type { NextApiRequest } from "next";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleFollowListsFollowing(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const following =
      await followListsAggregateRepo.getFollowingWithListMembership(uid);
    return { result: ok({ following }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}
