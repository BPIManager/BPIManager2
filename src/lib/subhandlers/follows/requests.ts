import type { NextApiRequest } from "next";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followRequestsAggregateRepo } from "@/lib/db/aggregates/followRequests";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { approveFollowRequest } from "@/lib/db/orchestrators/followRequestApproval";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";


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

