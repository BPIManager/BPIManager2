import { NextApiRequest } from "next";
import { AccessResult, authenticateViewer } from "./withApi";
import { usersRepo } from "@/lib/db/domains/users";

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

  if (userData.isPublic === 1) {
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
