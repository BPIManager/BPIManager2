import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * auth 系（apiKey / oauthClient / token / invite/[token] /
 * usernames/[username]/availability / トップレベル follow-requests/**）の
 * subhandler 共通型・ヘルパー。ユーザースコープ外。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}
