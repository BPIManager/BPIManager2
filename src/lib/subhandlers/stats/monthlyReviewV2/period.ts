import dayjs from "@/lib/dayjs";

import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

export type MonthlyReviewGranularity = "month" | "year" | "version";

export interface ResolvedMonthlyReviewPeriod {
  granularity: MonthlyReviewGranularity;
  monthStart: string;
  monthEnd: string;
  useMonthBuckets: boolean;
}

/**
 * "all"（バージョン全体）は、各クエリが version 列でも絞り込むことを利用し、発売より確実に前の固定日付〜当日を期間として渡す。
 * バージョンごとの稼働開始・終了日は管理しない。
 */
export function resolveMonthlyReviewPeriod(
  month: string,
): ResolvedMonthlyReviewPeriod {
  const isAllMode = month === "all";
  const isYearMode = !isAllMode && /^\d{4}$/.test(month);
  const granularity: MonthlyReviewGranularity = isAllMode
    ? "version"
    : isYearMode
      ? "year"
      : "month";
  const monthStart = isAllMode
    ? "2000-01-01"
    : isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).format("YYYY-MM-DD");
  const monthEnd = isAllMode
    ? dayjs.tz().format("YYYY-MM-DD")
    : isYearMode
      ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
      : dayjs.tz(`${month}-01`).endOf("month").format("YYYY-MM-DD");
  return {
    granularity,
    monthStart,
    monthEnd,
    useMonthBuckets: isYearMode || isAllMode,
  };
}

/**
 * 全期間モードの「最も伸びた曲」の既定比較先（IIDX_VERSIONS 上で1つ前のバージョン）を返す。先頭バージョンは比較対象が無いため null。
 */
export function previousVersionOf(version: string): string | null {
  const idx = (IIDX_VERSIONS as readonly string[]).indexOf(version);
  if (idx <= 0) return null;
  return IIDX_VERSIONS[idx - 1];
}
