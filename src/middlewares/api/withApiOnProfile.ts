import { NextApiRequest } from "next";
import { AccessResult } from "./withApi";
import { db } from "@/lib/db";
import { adminAuth } from "@/lib/firebase/admin";

export async function checkProfileAccess(
  req: NextApiRequest,
  targetUserId: string,
): Promise<AccessResult> {
  const userData = await db
    .selectFrom("users")
    .select(["userId", "isPublic"])
    .where("userId", "=", targetUserId)
    .executeTakeFirst();

  if (!userData) {
    return {
      hasAccess: false,
      error: { status: 404, message: "User not found." },
    };
  }

  const viewerId = await authenticateViewer(req);

  const isOwner = viewerId === targetUserId;
  const canAccess = userData.isPublic === 1 || isOwner;

  if (canAccess) {
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
  const xApiKey = req.headers["x-api-key"];
  const authHeader = req.headers.authorization;

  if (xApiKey) {
    const keyOwner = await db
      .selectFrom("apiKeys")
      .select("userId")
      .where("key", "=", xApiKey as string)
      .executeTakeFirst();
    if (keyOwner) return keyOwner.userId;
  }

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
