import type { NextApiRequest } from "next";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { approveFollowRequest } from "@/lib/db/orchestrators/followRequestApproval";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";

function parseRequestId(req: NextApiRequest): number | null {
  return parseIntParam("requestId", req.query.requestId);
}

/** POST /users/[userId]/follow-requests/[requestId] */
export async function handleApproveFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseRequestId(req);
  if (id === null) {
    return {
      result: invalidParam("requestId", req.query.requestId, "Invalid requestId"),
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
      result: invalidParam("requestId", req.query.requestId, "Invalid requestId"),
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
