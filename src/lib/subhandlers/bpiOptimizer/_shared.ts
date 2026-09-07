import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * bpi-optimizer / optimizeMemo（`analytics/bpi-optimizer`・`optimizeMemo/**`）の
 * subhandler 共通型・ヘルパー。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}
export function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}
