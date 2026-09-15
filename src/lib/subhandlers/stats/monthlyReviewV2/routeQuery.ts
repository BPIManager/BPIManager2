import type { NextApiRequest, NextApiResponse } from "next";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { parseOgpSections, type OgpSectionKey } from "@/lib/monthly-review/ogpSections";

export interface MonthlyReviewRouteQuery {
  userId: string;
  version: string;
  month: string;
  compareVersion?: string;
  sections: [OgpSectionKey, OgpSectionKey];
  excludeNewPlays?: boolean;
}

/**
 * monthly-review配下の各v2ルート（bpi/top-songs/radar-growth/activity/rivals/arena/ogp）
 * で共通のクエリバリデーション。`compareVersion`は使わないルートでも無害なため常に解決する。
 */
export function parseMonthlyReviewQuery(
  req: NextApiRequest,
  res: NextApiResponse,
): MonthlyReviewRouteQuery | null {
  // OGPクローラー等がGETの前にHEADで疎通確認することがあるため許可する
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).end();
    return null;
  }
  const userId = req.query.userId as string;
  const version = req.query.version as string;
  const month = req.query.month as string;
  const compareVersion = req.query.compareVersion as string | undefined;
  const isYearMode = /^\d{4}$/.test(month ?? "");
  const isMonthMode = /^\d{4}-\d{2}$/.test(month ?? "");
  const isAllMode = month === "all";
  const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ message: "Invalid userId" });
    return null;
  }
  if (
    !version ||
    !isValidVersion ||
    !month ||
    (!isYearMode && !isMonthMode && !isAllMode)
  ) {
    res.status(400).json({
      message: "Missing or invalid params: version, month (YYYY-MM, YYYY or all)",
    });
    return null;
  }
  if (
    compareVersion !== undefined &&
    !(IIDX_VERSIONS as readonly string[]).includes(compareVersion)
  ) {
    res.status(400).json({ message: "Invalid compareVersion" });
    return null;
  }
  const sections = parseOgpSections(req.query.ogp as string | undefined);
  const excludeNewPlays = req.query.excludeNewPlays === "true";
  return { userId, version, month, compareVersion, sections, excludeNewPlays };
}
