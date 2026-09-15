import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { db } from "@/lib/db";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import {
  previousVersionOf,
  jstDayStart,
  jstDayEnd,
} from "@/lib/subhandlers/stats/monthlyReviewV2/_shared";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleRivalMonthlyReviewSummary(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const { userId, month, version } = req.query;
  if (!userId || !month || !version) {
    return {
      result: err(400, "userId, month, version are required"),
      targetUserId,
      viewerId: null,
    };
  }
  const isAllMode = month === "all";
  const isYearMode = !isAllMode && /^\d{4}$/.test(month as string);
  const isMonthMode = !isAllMode && /^\d{4}-\d{2}$/.test(month as string);
  const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(
    version as string,
  );
  if (!isValidVersion || (!isYearMode && !isMonthMode && !isAllMode)) {
    return {
      result: err(400, "Invalid month or version"),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const monthStart = isAllMode
      ? "2000-01-01"
      : isYearMode
        ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
        : dayjs.tz(`${month as string}-01`).format("YYYY-MM-DD");
    const monthEnd = isAllMode
      ? dayjs.tz().format("YYYY-MM-DD")
      : isYearMode
        ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
        : dayjs
            .tz(`${month as string}-01`)
            .endOf("month")
            .format("YYYY-MM-DD");
    // 全期間モードは期間開始前スコアとの比較が意味を持たないため、
    // monthly-review側の各エンドポイントと同じく前バージョンとの比較に切り替える
    const compareVersion = isAllMode
      ? (previousVersionOf(version as string) ?? undefined)
      : undefined;

    const rivalRows = await followListAggregateRepo.getPublicFollowingUsers(
      userId as string,
    );
    if (rivalRows.length === 0) {
      return { result: ok({ rivals: [] }), targetUserId, viewerId };
    }
    const rivalIds = rivalRows.map((r) => r.userId);

    // 総合BPIはシフト法で再計算せず、スコア取り込み時に既にratchet適用済みで
    // 書き込まれる`userStatusLogs.totalBpi`ログをそのまま使う
    // （computeOwnerBpiTimelineと同じ設計）
    const startDate = jstDayStart(monthStart);
    const endDate = jstDayEnd(monthEnd);
    const [logsInRange, baselineLogs] = await Promise.all([
      userStatusLogsRepo.getLogsInRangeBatch(
        db,
        rivalIds,
        version as string,
        startDate,
        endDate,
      ),
      compareVersion
        ? userStatusLogsRepo.getLatestTotalBpiBatch(db, rivalIds, compareVersion)
        : userStatusLogsRepo.getLatestBeforeBatch(
            db,
            rivalIds,
            version as string,
            startDate,
          ),
    ]);

    const logsByUser = new Map<string, { date: string; value: number }[]>();
    for (const row of logsInRange) {
      if (row.totalBpi == null) continue;
      const arr = logsByUser.get(row.userId) ?? [];
      arr.push({
        date: dayjs(row.createdAt).tz().format("YYYY-MM-DD"),
        value: Number(row.totalBpi),
      });
      logsByUser.set(row.userId, arr);
    }
    const baselineByUser = new Map<string, number>();
    for (const row of baselineLogs) {
      if (row.totalBpi != null) baselineByUser.set(row.userId, Number(row.totalBpi));
    }

    const rivals = rivalRows
      .map((r) => {
        const baseline = baselineByUser.get(r.userId);
        // 全期間モードは比較先バージョンのデータが無いライバルを比較不能として除外
        if (compareVersion && baseline === undefined) return null;
        const bpiStart = baseline ?? -15;

        const rawHistory = (logsByUser.get(r.userId) ?? []).sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        const bpiEnd =
          rawHistory.length > 0 ? rawHistory[rawHistory.length - 1].value : bpiStart;

        return {
          userId: r.userId,
          userName: r.userName,
          profileImage: r.profileImage,
          bpiStart,
          bpiEnd,
        };
      })
      .filter((r) => r !== null);

    return { result: ok({ rivals }), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/following/scores （withAuth） */
