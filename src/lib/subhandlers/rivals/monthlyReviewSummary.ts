import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
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
  const isYearMode = /^\d{4}$/.test(month as string);
  const isMonthMode = /^\d{4}-\d{2}$/.test(month as string);
  const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(
    version as string,
  );
  if (!isValidVersion || (!isYearMode && !isMonthMode)) {
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

    const monthStart = isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY-MM-DD")
      : dayjs.tz(`${month as string}-01`).format("YYYY-MM-DD");
    const monthEnd = isYearMode
      ? dayjs.tz(`${month}-12-31`).format("YYYY-MM-DD")
      : dayjs.tz(`${month as string}-01`).endOf("month").format("YYYY-MM-DD");

    const rivalRows =
      await followListAggregateRepo.getPublicFollowingUsers(userId as string);
    if (rivalRows.length === 0) {
      return { result: ok({ rivals: [] }), targetUserId, viewerId };
    }
    const rivalIds = rivalRows.map((r) => r.userId);

    const [preMonthState, inMonthHistory, totalSongs] = await Promise.all([
      monthlyReviewRepo.getPreMonthBpiStateForUsers(
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
      statsTablesRepo.getTotalSongCount([12], [...IIDX_DIFFICULTIES]),
    ]);

    const preByUser = new Map<string, Map<number, number>>();
    for (const s of preMonthState) {
      if (!preByUser.has(s.userId)) preByUser.set(s.userId, new Map());
      preByUser
        .get(s.userId)!
        .set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
    }
    const historyByUser = new Map<string, typeof inMonthHistory>();
    for (const s of inMonthHistory) {
      if (!historyByUser.has(s.userId)) historyByUser.set(s.userId, []);
      historyByUser.get(s.userId)!.push(s);
    }

    const rivals = rivalRows.map((r) => {
      const preMap = preByUser.get(r.userId) ?? new Map<number, number>();
      const history = historyByUser.get(r.userId) ?? [];
      const { bpiStart, bpiEnd } = buildBpiTimeline(
        preMap,
        history,
        totalSongs,
        isYearMode,
      );
      return {
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        bpiStart,
        bpiEnd,
      };
    });

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
