import type { NextApiRequest } from "next";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

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
