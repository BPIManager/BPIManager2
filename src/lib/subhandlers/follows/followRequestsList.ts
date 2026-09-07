import type { NextApiRequest } from "next";
import { followRequestsAggregateRepo } from "@/lib/db/aggregates/followRequests";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
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
