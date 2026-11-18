import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest, NextApiResponse } from "next";
import { writeMiddlewareError } from "./apiResult";
export interface AuthenticatedNextApiRequest extends NextApiRequest {
  authUid: string;
}

type ApiHandler = (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => Promise<void> | void;

/** APIキー（`/token` の X-API-Key）由来のセッションに付けるカスタムクレーム名 */
export const API_KEY_SESSION_CLAIM = "viaApiKey";

/**
 * Firebase IDトークンを検証し req.authUid を設定する。本人確認は query/body の userId がある場合のみ行われる。
 * userId を持たないルートは検証のみとなるため、userId パラメータを持つルートは query または body に含めること。
 *
 * @param handler - ラップ対象の API ハンドラー
 * @param options.rejectApiKeySession - true の場合、APIキー由来のセッションを403で拒否する（アカウント・連携・APIキー管理系）
 */
export const withAuth = (
  handler: ApiHandler,
  options?: { rejectApiKeySession?: boolean },
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return writeMiddlewareError(req, res, 401, "Missing or invalid token");
    }

    const idToken = authHeader.split("Bearer ")[1];

    let authUid: string;
    let viaApiKey = false;
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      authUid = decodedToken.uid;
      viaApiKey = decodedToken[API_KEY_SESSION_CLAIM] === true;
    } catch (error: unknown) {
      console.error("Auth Middleware Error:", error);
      return writeMiddlewareError(req, res, 401, "Invalid or expired token");
    }

    if (options?.rejectApiKeySession && viaApiKey) {
      return writeMiddlewareError(
        req,
        res,
        403,
        "Forbidden: not allowed with an API key session",
      );
    }

    const userIdFromQuery = req.query.userId as string;
    const userIdFromBody = req.body?.userId;

    if (
      (userIdFromQuery && authUid !== userIdFromQuery) ||
      (userIdFromBody && authUid !== userIdFromBody)
    ) {
      return writeMiddlewareError(req, res, 403, "Forbidden: User ID mismatch");
    }

    (req as AuthenticatedNextApiRequest).authUid = authUid;

    try {
      return await handler(req as AuthenticatedNextApiRequest, res);
    } catch (error: unknown) {
      console.error("Auth Middleware Error:", error);
      if (res.headersSent) return;
      return writeMiddlewareError(req, res, 500, "Internal Server Error");
    }
  };
};
