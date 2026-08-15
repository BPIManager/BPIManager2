import { NextApiRequest } from "next";
import { AccessResult, authenticateViewer } from "./withApi";
import { usersRepo } from "@/lib/db/domains/users";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";
import { canViewUserData } from "@/lib/db/shared/visibility";

export async function checkProfileAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const viewerId = await authenticateViewer(req);
  const isOwner = viewerId === targetUserId;

  const userData = await usersRepo.getAccessInfo(targetUserId);

  if (isOwner) {
    return {
      hasAccess: true,
      user: userData,
      viewerId,
    };
  }

  if (!userData) {
    return {
      hasAccess: false,
      error: { status: 404, message: "User not found." },
    };
  }

  // isPublicで既に許可される場合はfollows/承認記録の確認(DBアクセス)を省略する
  const hasFollowAccess =
    !userData.isPublic &&
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
    return {
      hasAccess: true,
      user: userData,
      viewerId,
    };
  }

  return {
    hasAccess: false,
    error: { status: 403, message: "This profile is set as a private." },
  };
}
