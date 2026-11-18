import type { NextApiRequest } from "next";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";
import { invalidParam, parseStringParam } from "@/lib/validation/params";

export async function handleWithdrawFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<{ withdrawn: boolean }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const targetUserId = parseStringParam("targetUserId", req.query.targetUserId);
  if (targetUserId === null) {
    return { result: invalidParam("targetUserId", req.query.targetUserId, "Invalid targetUserId"), ...base };
  }
  try {
    const withdrawn = await followRequestsRepo.withdraw(uid, targetUserId);
    return { result: ok({ withdrawn }), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
