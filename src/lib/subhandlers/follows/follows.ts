import type { NextApiRequest } from "next";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { followsRepo } from "@/lib/db/domains/follow";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { unfollowAndCleanupLists } from "@/lib/db/orchestrators/unfollow";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { followsQuerySchema } from "@/schemas/follows/query";
import type { HandleOutcome } from "./_shared";

/** GET /users/[userId]/follows */
export async function handleFollowsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  if (!targetUserId) {
    return {
      result: err(400, "Invalid or missing userId"),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const parsed = followsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return {
        result: err(
          400,
          parsed.error.issues[0]?.message ?? "Invalid query parameters",
        ),
        targetUserId,
        viewerId,
      };
    }

    const result = await followListAggregateRepo.getFollowList({
      targetUserId,
      viewerId: access.viewerId,
      type: parsed.data.type,
      version: latestVersion,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** PUT /users/[userId]/follows */
export async function handleFollow(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  if (!targetUserId) {
    return {
      result: err(400, "Invalid or missing userId"),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    // 非公開ユーザーへの直接フォローは checkProfileAccess が既に 403 で弾く
    // (#275: 非公開ユーザーへのフォローは招待URL経由のリクエスト承認でのみ成立)
    if (!access.viewerId) {
      return { result: err(401, "Unauthorized"), targetUserId, viewerId };
    }
    const uid = access.viewerId;

    if (uid === targetUserId) {
      return {
        result: err(400, "You cannot follow yourself"),
        targetUserId,
        viewerId,
      };
    }

    const isAlreadyFollowing = await followsRepo.isFollowing(uid, targetUserId);
    if (isAlreadyFollowing) {
      return {
        result: ok({
          success: true,
          isFollowing: true,
          message: "Already followed",
        }),
        targetUserId,
        viewerId,
      };
    }

    const isFollowed = await followsRepo.toggleFollow(uid, targetUserId);
    return {
      result: ok({
        success: true,
        isFollowing: isFollowed,
        message: "Followed",
      }),
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

/** DELETE /users/[userId]/follows */
export async function handleUnfollow(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  if (!targetUserId) {
    return {
      result: err(400, "Invalid or missing userId"),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    if (!access.viewerId) {
      return { result: err(401, "Unauthorized"), targetUserId, viewerId };
    }
    const uid = access.viewerId;

    const isCurrentlyFollowing = await followsRepo.isFollowing(
      uid,
      targetUserId,
    );
    if (!isCurrentlyFollowing) {
      return {
        result: ok({
          success: true,
          isFollowing: false,
          message: "Already unfollowed",
        }),
        targetUserId,
        viewerId,
      };
    }

    await unfollowAndCleanupLists(uid, targetUserId);
    return {
      result: ok({
        success: true,
        isFollowing: false,
        message: "Unfollowed",
      }),
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
