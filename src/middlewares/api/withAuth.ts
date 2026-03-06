import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest, NextApiResponse } from "next";
export interface AuthenticatedNextApiRequest extends NextApiRequest {
  authUid: string;
}

type ApiHandler = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

export const withAuth = (handler: ApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const authUid = decodedToken.uid;

      const userIdFromQuery = req.query.userId as string;
      const userIdFromBody = req.body?.userId;

      if (
        (userIdFromQuery && authUid !== userIdFromQuery) ||
        (userIdFromBody && authUid !== userIdFromBody)
      ) {
        return res.status(403).json({ message: "Forbidden: User ID mismatch" });
      }

      (req as AuthenticatedNextApiRequest).authUid = authUid;

      return handler(req as AuthenticatedNextApiRequest, res);
    } catch (error: any) {
      console.error("Auth Middleware Error:", error);
      const status = error.code === "auth/id-token-expired" ? 401 : 500;
      return res
        .status(status)
        .json({ message: error.message || "Internal Server Error" });
    }
  };
};
