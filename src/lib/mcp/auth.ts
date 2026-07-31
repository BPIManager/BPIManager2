import { NextApiRequest } from "next";
import { db } from "@/lib/db";
import { oauthRepo } from "@/lib/db/domains/oauth";

export function getBaseUrl() {
  return (process.env.BASEURL ?? "").replace(/\/+$/, "");
}

export async function resolveUserIdFromBearerToken(
  req: NextApiRequest,
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice("Bearer ".length);
  const tokenRecord = await oauthRepo.findAccessToken(accessToken);

  return tokenRecord?.userId ?? null;
}

/**
 * MCP経由のリクエストはFirebase IDトークンではなくOAuthアクセストークンでuserIdを解決済みのため、
 * REST APIの checkUserAccess はそのまま使えない（Firebaseトークン検証を前提としているため）。
 * 自分自身は無条件許可、他人は公開プロフィール(isPublic=1)のみ許可する軽量版。
 */
export async function checkSelfOrPublicAccess(
  selfUserId: string,
  targetUserId: string,
) {
  if (targetUserId === selfUserId) return { allowed: true as const };

  const target = await db
    .selectFrom("users")
    .select(["userId", "isPublic"])
    .where("userId", "=", targetUserId)
    .executeTakeFirst();

  if (!target) {
    return { allowed: false as const, message: "指定されたユーザーが見つかりません。" };
  }
  if (target.isPublic !== 1) {
    return {
      allowed: false as const,
      message: "このユーザーは非公開設定のため閲覧できません。",
    };
  }
  return { allowed: true as const };
}
