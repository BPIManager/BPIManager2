import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest, NextApiResponse } from "next";

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

export async function checkUserAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const userData = await db
    .selectFrom("users as u")
    .select(["u.userId", "u.isPublic"])
    .where("u.userId", "=", targetUserId)
    .executeTakeFirst();

  if (!userData) {
    return {
      hasAccess: false,
      error: { status: 404, message: "User not found." },
    };
  }

  if (userData.isPublic === 1) {
    return { hasAccess: true, user: userData };
  }

  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      if (decodedToken.uid === targetUserId) {
        return { hasAccess: true, user: userData, viewerId: decodedToken.uid };
      }
    } catch (e) {
      console.error("Access Control: Token verification failed");
    }
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
