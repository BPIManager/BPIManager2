import type { NextApiRequest } from "next";
import topElements from "@/constants/iidx/radars/topElements";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export const radarLookup = new Map<string, string>(
  (topElements as { title: string; difficulty: string; top: string }[]).map(
    (e) => [`${e.title}__${e.difficulty}`, e.top],
  ),
);

export function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}
