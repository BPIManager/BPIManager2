import type { NextApiRequest } from "next";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleWithdrawFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<{ withdrawn: boolean }>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const { targetUserId } = req.query;
  if (!targetUserId || typeof targetUserId !== "string") {
    return { result: err(400, "Invalid targetUserId"), ...base };
  }
  try {
    const withdrawn = await followRequestsRepo.withdraw(uid, targetUserId);
    return { result: ok({ withdrawn }), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
