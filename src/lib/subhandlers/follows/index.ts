import type { NextApiRequest } from "next";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { followsRepo } from "@/lib/db/domains/follow";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followApprovalNotificationsRepo } from "@/lib/db/domains/followApprovalNotifications";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";
import { followRequestsAggregateRepo } from "@/lib/db/aggregates/followRequests";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { unfollowAndCleanupLists } from "@/lib/db/orchestrators/unfollow";
import { approveFollowRequest } from "@/lib/db/orchestrators/followRequestApproval";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { followsQuerySchema } from "@/schemas/follows/query";
import { createFollowListBodySchema } from "@/schemas/followLists/create";
import { updateFollowListBodySchema } from "@/schemas/followLists/update";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * follows ドメイン（`users/[userId]/follows`・`follow-invite`・`follow-lists/**`・
 * `follow-requests/**`・`followers/[followerId]`）の subhandler 群。
 * ビジネスロジックを「`res` へ書き込む」形から切り離し、正規化した
 * `HandlerResult` を返す。v1/v2 のルートから共有する。
 *
 * `follows.ts` のみ bare + `checkProfileAccess`。それ以外は `withAuth`
 * （ルート側で `req.authUid` = 本人が保証される）。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}

/* ------------------------------ follows.ts ------------------------------ */

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

/* --------------------------- follow-invite.ts --------------------------- */

/** GET /users/[userId]/follow-invite */
export async function handleGetInviteToken(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const link = await followInviteLinksRepo.getByUserId(uid);
    return {
      result: ok({ token: link?.token ?? null }),
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

/** POST /users/[userId]/follow-invite */
export async function handleRegenerateInvite(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const token = await followInviteLinksRepo.regenerate(uid);
    return { result: ok({ token }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* -------------------------- follow-lists/index --------------------------- */

/** GET /users/[userId]/follow-lists */
export async function handleFollowListsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const lists = await followListsAggregateRepo.getListsWithMemberCount(uid);
    return { result: ok({ lists }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** POST /users/[userId]/follow-lists （成功時 v1 は 201） */
export async function handleCreateFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const parsed = createFollowListBodySchema.safeParse(req.body);
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
    const id = await followListsRepo.create(
      uid,
      parsed.data.name,
      parsed.data.isPublic,
    );
    return { result: ok({ id }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ------------------------- follow-lists/[listId] ------------------------- */

function parseListId(req: NextApiRequest): number | null {
  const { listId } = req.query;
  const id = Number(listId);
  if (!listId || Number.isNaN(id)) return null;
  return id;
}

/** PATCH /users/[userId]/follow-lists/[listId] */
export async function handleUpdateFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid listId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  const parsed = updateFollowListBodySchema.safeParse(req.body);
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
    const updated = await followListsRepo.update(id, uid, {
      name: parsed.data.name,
      isPublic: parsed.data.isPublic,
    });
    if (!updated) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "updated" }),
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

/** DELETE /users/[userId]/follow-lists/[listId] */
export async function handleDeleteFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid listId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const removed = await followListsRepo.remove(id, uid);
    if (!removed) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "deleted" }),
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

/* ------------------ follow-lists/[listId]/members/[followingId] ------------------ */

/** PUT /users/[userId]/follow-lists/[listId]/members/[followingId] */
export async function handleAddListMember(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  const { followingId } = req.query;
  if (id === null || typeof followingId !== "string") {
    return {
      result: err(400, "Invalid parameters"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const list = await followListsRepo.getById(id);
    if (!list || list.userId !== uid) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    const isFollowing = await followsRepo.isFollowing(uid, followingId);
    if (!isFollowing) {
      return {
        result: err(400, "Not following this user"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    await followListMembersRepo.addMember(id, followingId);
    return {
      result: ok({ status: "added" }),
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

/** DELETE /users/[userId]/follow-lists/[listId]/members/[followingId] */
export async function handleRemoveListMember(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  const { followingId } = req.query;
  if (id === null || typeof followingId !== "string") {
    return {
      result: err(400, "Invalid parameters"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const list = await followListsRepo.getById(id);
    if (!list || list.userId !== uid) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    await followListMembersRepo.removeMember(id, followingId);
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

/* ---------------------- follow-lists/following.ts ---------------------- */

/** GET /users/[userId]/follow-lists/following */
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

/* --------------------- follow-requests/index.ts --------------------- */

/** GET /users/[userId]/follow-requests */
export async function handleFollowRequestsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const [pendingRequests, unapprovedFollowers] = await Promise.all([
      followRequestsAggregateRepo.listPendingForTarget(uid),
      followAccessAggregateRepo.listUnapprovedFollowers(uid),
    ]);

    const requesterIdsWithRealRequest = new Set(
      pendingRequests.map((r) => r.requesterId),
    );

    const requests = [
      ...pendingRequests.map((r) => ({
        kind: "request" as const,
        id: r.id,
        requesterId: r.requesterId,
        requesterName: r.requesterName,
        requesterImage: r.requesterImage,
        createdAt: r.createdAt,
      })),
      ...unapprovedFollowers
        .filter((f) => !requesterIdsWithRealRequest.has(f.followerId))
        .map((f) => ({
          kind: "legacy" as const,
          requesterId: f.followerId,
          requesterName: f.followerName,
          requesterImage: f.followerImage,
          createdAt: f.createdAt,
        })),
    ].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return { result: ok({ requests }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* -------------------- follow-requests/[requestId].ts -------------------- */

function parseRequestId(req: NextApiRequest): number | null {
  const { requestId } = req.query;
  const id = Number(requestId);
  if (!requestId || Number.isNaN(id)) return null;
  return id;
}

/** POST /users/[userId]/follow-requests/[requestId] */
export async function handleApproveFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseRequestId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid requestId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const requesterId = await approveFollowRequest(id, uid);
    if (!requesterId) {
      return {
        result: err(404, "Request not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "approved", requesterId }),
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

/** DELETE /users/[userId]/follow-requests/[requestId] */
export async function handleRejectFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseRequestId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid requestId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const rejected = await followRequestsRepo.reject(id, uid);
    if (!rejected) {
      return {
        result: err(404, "Request not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "rejected" }),
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

/* --------------------- followers/[followerId].ts --------------------- */

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
