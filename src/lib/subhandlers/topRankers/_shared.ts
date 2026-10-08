import type { NextApiRequest } from "next";
import type { HandlerResult } from "@/types/api";
import type { TopRankerAreaCount } from "@/lib/db/aggregates/topRankers/summary";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export interface TopRankersSummary {
  /** プレイヤーのIIDX IDが未設定のとき false（集計は常に空） */
  hasIidxId: boolean;
  counts: TopRankerAreaCount[];
}

export function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}
