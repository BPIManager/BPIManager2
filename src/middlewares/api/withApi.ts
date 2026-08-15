import { usersRepo } from "@/lib/db/domains/users";
import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest, NextApiResponse } from "next";
import { canViewUserData } from "@/lib/db/shared/visibility";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

export interface AccessResult {
  hasAccess: boolean;
  user?: {
    userId: string;
    isPublic: number;
  };
  error?: {
    status: number;
    message: string;
  };
  viewerId?: string;
}

/**
 * リクエストのAuthorizationヘッダーからFirebase IDトークンを検証し、
 * 送信者のuidを取得する。トークンが無い・検証に失敗した場合は`undefined`。
 */
export async function authenticateViewer(
  req: NextApiRequest,
): Promise<string | undefined> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return decodedToken.uid;
    } catch {
      console.error("Auth: Token verification failed");
    }
  }

  return undefined;
}

export async function checkUserAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const userData = await usersRepo.getAccessInfo(targetUserId);

  if (!userData) {
    return {
      hasAccess: false,
      error: { status: 404, message: "User not found." },
    };
  }

  if (canViewUserData({ targetUserId, isPublic: userData.isPublic })) {
    return { hasAccess: true, user: userData };
  }

  const viewerId = await authenticateViewer(req);
  const hasFollowAccess =
    !!viewerId &&
    (await followAccessAggregateRepo.hasApprovedFollowAccess(
      viewerId,
      targetUserId,
    ));

  if (
    canViewUserData({
      viewerId,
      targetUserId,
      isPublic: userData.isPublic,
      hasFollowAccess,
    })
  ) {
    return { hasAccess: true, user: userData, viewerId };
  }

  return {
    hasAccess: false,
    error: {
      status: 403,
      message: "You don't have enough permission to access this resource.",
    },
  };
}

export function rejectAccess(res: NextApiResponse, access: AccessResult) {
  return res
    .status(access.error!.status)
    .json({ message: access.error!.message });
}
