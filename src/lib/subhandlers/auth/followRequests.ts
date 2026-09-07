import type { NextApiRequest } from "next";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { submitFollowRequest } from "@/lib/db/orchestrators/followRequestSubmission";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { followRequestSubmitSchema } from "@/schemas/followRequests/submit";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleSubmitFollowRequest(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown> & { successStatus: number }> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid, successStatus: 200 };

  const parsed = followRequestSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      ...base,
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
    };
  }
  try {
    const result = await submitFollowRequest(uid, parsed.data.token);
    switch (result.status) {
      case "requested":
        return { ...base, result: ok({ status: "requested" }), successStatus: 201 };
      case "followed":
        return { ...base, result: ok({ status: "followed" }) };
      case "self":
        return { ...base, result: err(400, "You cannot follow yourself") };
      case "invalid_token":
        return { ...base, result: err(404, "Invalid invite link") };
      case "target_not_found":
        return { ...base, result: err(404, "User not found") };
    }
    return { ...base, result: err(500, "Internal Server Error") };
  } catch (error: unknown) {
    return { ...base, result: err(500, toErrorMessage(error)) };
  }
}

/** DELETE /follow-requests/[targetUserId] （送信済みリクエストの取り下げ） */
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
