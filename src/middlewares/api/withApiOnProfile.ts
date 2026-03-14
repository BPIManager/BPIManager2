import { NextApiRequest } from "next";
import { AccessResult } from "./withApi";
import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebase/admin";

export async function checkProfileAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const viewerId = await authenticateViewer(req);
  const isOwner = viewerId === targetUserId;

  const userData = await db
    .selectFrom("users")
    .select(["userId", "isPublic"])
    .where("userId", "=", targetUserId)
    .executeTakeFirst();

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

export async function authenticateViewer(
  req: NextApiRequest,
): Promise<string | undefined> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (e) {
      console.error("Auth: Token verification failed");
    }
  }

  return undefined;
}
