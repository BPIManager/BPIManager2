import { NextApiRequest } from "next";
import { usersRepo } from "@/lib/db/domains/users";
import { oauthRepo } from "@/lib/db/domains/oauth";
import { canViewUserData } from "@/lib/db/shared/visibility";
import { followAccessAggregateRepo } from "@/lib/db/aggregates/followAccess";

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
 * MCP 経由のリクエスト用の軽量なアクセス判定。OAuth で userId を解決済みのため REST の checkUserAccess（Firebase 前提）は使えない。
 * 自分は無条件許可、他人は公開（isPublic=1）または承認済みフォローがある場合のみ許可する。
 */
export async function checkSelfOrPublicAccess(
  selfUserId: string,
  targetUserId: string,
) {
  if (targetUserId === selfUserId) return { allowed: true as const };

  const target = await usersRepo.getAccessInfo(targetUserId);

  if (!target) {
    return { allowed: false as const, message: "指定されたユーザーが見つかりません。" };
  }
  const hasFollowAccess =
    !target.isPublic &&
    (await followAccessAggregateRepo.hasApprovedFollowAccess(
      selfUserId,
      targetUserId,
    ));

  if (
    !canViewUserData({
      viewerId: selfUserId,
      targetUserId,
      isPublic: target.isPublic,
      hasFollowAccess,
    })
  ) {
    return {
      allowed: false as const,
      message: "このユーザーは非公開設定のため閲覧できません。",
    };
  }
  return { allowed: true as const };
}
