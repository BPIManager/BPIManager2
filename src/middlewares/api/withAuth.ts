import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest, NextApiResponse } from "next";
export interface AuthenticatedNextApiRequest extends NextApiRequest {
  authUid: string;
}

type ApiHandler = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

/**
 * Firebase IDトークンを検証し、`req.authUid` を設定するAPIミドルウェア。
 *
 * 本人確認（ownership check）は `req.query.userId` または `req.body.userId`
 * が存在する場合にのみ副次的に行われる。`withAuth` を付けただけでは
 * 「他人のuserIdへのアクセスを防ぐ」ことは保証されない —
 * ルートが `userId` パラメータを持たない場合（例: apiKey.ts）、この
 * チェックは何もせずスキップされ、`req.authUid` によるトークン検証のみが
 * 行われる。userIdパラメータを持つルートを新設する際は、`query.userId`
 * または `body.userId` に対象ユーザーIDを含めることで本人確認が働く点に
 * 注意すること。
 */
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
    } catch (error: unknown) {
      console.error("Auth Middleware Error:", error);
      const isExpired =
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "auth/id-token-expired";
      const message =
        typeof error === "object" &&
        error !== null &&
        (error as { message?: string }).message;
      const status = isExpired ? 401 : 500;
      return res
        .status(status)
        .json({ message: message || "Internal Server Error" });
    }
  };
};
