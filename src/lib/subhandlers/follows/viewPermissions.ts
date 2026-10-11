import type { NextApiRequest } from "next";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { revokeViewPermission } from "@/lib/db/orchestrators/viewPermissionRevoke";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

/** GET /users/[userId]/view-permissions （承認済みのフォロワー一覧） */
export async function handleViewPermissionsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const approved = await followAccessAggregateRepo.listApprovedFollowers(uid);
    return {
      result: ok({
        approved: approved.map((f) => ({
          followerId: f.followerId,
          followerName: f.followerName,
          followerImage: f.followerImage,
          followedAt: f.followedAt,
          approvedAt: f.approvedAt,
        })),
      }),
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

/** DELETE /users/[userId]/view-permissions/[followerId] （閲覧権限だけの取り消し。フォロー関係は残る） */
export async function handleRevokeViewPermission(
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
    const revoked = await revokeViewPermission(followerId, uid);
    if (!revoked) {
      return {
        result: err(404, "Approved follower not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "revoked" }),
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
