import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";

/**
 * user songs ドメインの subhandler 群。全エンドポイントは withUserApiHandler を使い、ルートはラッパーを維持したまま本体を委譲する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}
