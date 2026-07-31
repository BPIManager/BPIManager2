import { adminAuth } from "@/lib/firebase/admin";
import type { NextApiRequest } from "next";

/**
 * リクエストのBearerトークンを検証し、有効なら uid を返す。
 * トークンが無い/無効な場合は空文字を返す（匿名アクセスを許容するAPIで使用）。
 *
 * @param req - APIリクエスト
 * @returns 検証済みuid、またはトークンが無い/無効な場合は空文字
 */
export async function resolveOptionalUid(req: NextApiRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return "";
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return "";
  }
}
