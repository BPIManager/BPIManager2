import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildBpiTimeline, calculateTotalBpiForScores } from "@/lib/monthly-review/bpi";
import { previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/_shared";
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
    const useMonthBuckets = isYearMode || isAllMode;
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

    const [preMonthState, inMonthHistory, allL12SongMeta, compareVersionState] =
      await Promise.all([
        compareVersion
          ? Promise.resolve([])
          : monthlyReviewRepo.getPreMonthBpiStateForUsers(
              rivalIds,
              version as string,
              monthStart,
            ),
        monthlyReviewRepo.getInMonthScoreHistoryForUsers(
          rivalIds,
          version as string,
          monthStart,
          monthEnd,
        ),
        monthlyReviewRepo.getAllL12SongMeta(),
        compareVersion
          ? monthlyReviewRepo.getVersionBpiStateForUsers(rivalIds, compareVersion)
          : Promise.resolve(undefined),
      ]);

    const preByUser = new Map<string, Map<number, number>>();
    for (const s of preMonthState) {
      if (s.exScore == null) continue;
      if (!preByUser.has(s.userId)) preByUser.set(s.userId, new Map());
      preByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
    }
    const compareVersionByUser = new Map<string, Map<number, number>>();
    for (const s of compareVersionState ?? []) {
      if (s.exScore == null) continue;
      if (!compareVersionByUser.has(s.userId))
        compareVersionByUser.set(s.userId, new Map());
      compareVersionByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
    }
    const historyByUser = new Map<string, typeof inMonthHistory>();
    for (const s of inMonthHistory) {
      if (!historyByUser.has(s.userId)) historyByUser.set(s.userId, []);
      historyByUser.get(s.userId)!.push(s);
    }

    const rivals = rivalRows
      .map((r) => {
        const history = historyByUser.get(r.userId) ?? [];
        if (compareVersion) {
          const compareMap = compareVersionByUser.get(r.userId);
          if (!compareMap || compareMap.size === 0) return null;
          const { bpiEnd } = buildBpiTimeline(
            new Map(),
            history,
            allL12SongMeta,
            useMonthBuckets,
          );
          const bpiStart = calculateTotalBpiForScores(compareMap, allL12SongMeta);
          return {
            userId: r.userId,
            userName: r.userName,
            profileImage: r.profileImage,
            bpiStart,
            bpiEnd,
          };
        }
        const preMap = preByUser.get(r.userId) ?? new Map<number, number>();
        const { bpiStart, bpiEnd } = buildBpiTimeline(
          preMap,
          history,
          allL12SongMeta,
          useMonthBuckets,
        );
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
