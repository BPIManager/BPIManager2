import dayjs from "dayjs";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * ranking ドメイン（`users/[userId]/ranking/**`）の subhandler 共通型・ヘルパー。
 * 全エンドポイント `withAuth`（本人のみ、`viewerId = req.authUid`）。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

export const RADAR_CATEGORIES = [
  "notes",
  "chord",
  "peak",
  "charge",
  "scratch",
  "soflan",
] as const;
export type RadarCategory = (typeof RADAR_CATEGORIES)[number];

export function targetOf(req: AuthenticatedNextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : req.authUid;
}

export function parsePeriodDates(
  period: string,
  date: string,
): { startDate: string; endDate: string } {
  const d = dayjs(date);
  if (!d.isValid()) {
    const today = dayjs().format("YYYY-MM-DD");
    return { startDate: today, endDate: today };
  }

  if (period === "week") {
    const dow = d.day();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = d.add(mondayOffset, "day");
    return {
      startDate: monday.format("YYYY-MM-DD"),
      endDate: monday.add(6, "day").format("YYYY-MM-DD"),
    };
  }

  if (period === "month") {
    return {
      startDate: d.startOf("month").format("YYYY-MM-DD"),
      endDate: d.endOf("month").format("YYYY-MM-DD"),
    };
  }

  const dateStr = d.format("YYYY-MM-DD");
  return { startDate: dateStr, endDate: dateStr };
}
