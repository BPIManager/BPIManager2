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

import type { RadarCategory as CanonicalRadarCategory } from "@/types/stats/radar";

/**
 * API のクエリ値（小文字）。レーダーカテゴリの正規の型（大文字）から導出し、
 * 網羅性は下の型チェックで担保する（値そのものは API 形式として変えない）。
 */
export const RADAR_CATEGORIES = [
  "notes",
  "chord",
  "peak",
  "charge",
  "scratch",
  "soflan",
] as const;
export type RadarCategory = Lowercase<CanonicalRadarCategory>;
type _AllRadarCategoriesListed = Exclude<
  RadarCategory,
  (typeof RADAR_CATEGORIES)[number]
> extends never
  ? true
  : never;
const _allRadarCategoriesListed: _AllRadarCategoriesListed = true;

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
