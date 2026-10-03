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
 * "all"（バージョン全体）は、各クエリが既にversion列でも絞り込んでいることを
 * 利用し、バージョン発売より確実に前の固定日付〜当日を期間として渡すことで
 * 実現する。バージョンごとの稼働開始/終了日を新たに管理する仕組みは追加しない。
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
 * 「全期間（月=all）」モードでの楽曲ハイライト「最も伸びた曲」の既定比較先バージョン
 * （＝1つ前のバージョン）を返す。`IIDX_VERSIONS`の並び順（26〜34, INF）上での
 * 直前の要素とする。先頭バージョン（比較対象が無い）の場合は`null`。
 */
export function previousVersionOf(version: string): string | null {
  const idx = (IIDX_VERSIONS as readonly string[]).indexOf(version);
  if (idx <= 0) return null;
  return IIDX_VERSIONS[idx - 1];
}
