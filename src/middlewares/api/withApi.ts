import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest } from "next";

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
}

export async function checkUserAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const userData = await db
    .selectFrom("users as u")
    .leftJoin("apiKeys as ak", "u.userId", "ak.userId")
    .select(["u.userId", "u.isPublic", "ak.key as apiKey"])
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
  const xApiKey = req.headers["x-api-key"];

  if (xApiKey && userData.apiKey && xApiKey === userData.apiKey) {
    return { hasAccess: true, user: userData };
  }

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      if (decodedToken.uid === targetUserId) {
        return { hasAccess: true, user: userData };
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
