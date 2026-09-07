import type { NextApiRequest } from "next";
import { followsRepo } from "@/lib/db/domains/follow";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { unfollowAndCleanupLists } from "@/lib/db/orchestrators/unfollow";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";


/** DELETE /users/[userId]/followers/[followerId] */
export async function handleRemoveFollower(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const { followerId } = req.query;
  if (!followerId || typeof followerId !== "string") {
    return {
      result: err(400, "Invalid followerId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const removed = await unfollowAndCleanupLists(followerId, uid);
    if (!removed) {
      return {
        result: err(404, "Follower not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "removed" }),
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

/** POST /users/[userId]/followers/[followerId] （legacy フォロワーの事後承認） */
export async function handleApproveLegacyFollower(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const { followerId } = req.query;
  if (!followerId || typeof followerId !== "string") {
    return {
      result: err(400, "Invalid followerId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const isFollowing = await followsRepo.isFollowing(followerId, uid);
    if (!isFollowing) {
      return {
        result: err(404, "Follower not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    await followApprovalNotificationsRepo.recordApproval(followerId, uid);
    await followRequestsRepo.withdraw(followerId, uid);
    return {
      result: ok({ status: "approved" }),
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
