import type { NextApiRequest } from "next";
import { usersRepo } from "@/lib/db/domains/users";
import { followsRepo } from "@/lib/db/domains/follow";
import { followRequestsRepo } from "@/lib/db/domains/followRequests";
import { followInviteLinksRepo } from "@/lib/db/domains/followInviteLinks";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { type HandleOutcome } from "./_shared";

export async function handleResolveInvite(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const { token } = req.query;
  const base = { targetUserId: "", viewerId: null as string | null };
  if (!token || typeof token !== "string") {
    return { result: err(400, "Invalid token"), ...base };
  }
  try {
    const followInvite = await followInviteLinksRepo.getByToken(token);
    if (!followInvite) {
      return { result: err(404, "Invalid invite link"), ...base };
    }
    const inviter = await usersRepo.getDisplayInfo(followInvite.userId);
    if (!inviter) {
      return { result: err(404, "User not found"), ...base };
    }

    const viewerId = (await authenticateViewer(req)) ?? null;
    let isFollowing = false;
    let hasPendingRequest = false;
    if (viewerId && viewerId !== inviter.userId) {
      [isFollowing, hasPendingRequest] = await Promise.all([
        inviter.isPublic
          ? followsRepo.isFollowing(viewerId, inviter.userId)
          : followAccessAggregateRepo.hasApprovedFollowAccess(
              viewerId,
              inviter.userId,
            ),
        followRequestsRepo.existsPending(viewerId, inviter.userId),
      ]);
    }

    return {
      result: ok({
        type: "follow" as const,
        userId: inviter.userId,
        userName: inviter.userName,
        profileImage: inviter.profileImage,
        isFollowing,
        hasPendingRequest,
      }),
      targetUserId: inviter.userId,
      viewerId,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* ---------------- usernames/[username]/availability.ts ---------------- */
