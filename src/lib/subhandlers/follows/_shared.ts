import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * follows ドメインの subhandler 共通型・ヘルパー。
 * `follows.ts` のみ bare + checkProfileAccess。それ以外は withAuth
 * （ルート側で req.authUid = 本人が保証される）。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}
