import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
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
      : dayjs
          .tz(`${month as string}-01`)
          .endOf("month")
          .format("YYYY-MM-DD");

    const rivalRows = await followListAggregateRepo.getPublicFollowingUsers(
      userId as string,
    );
    if (rivalRows.length === 0) {
      return { result: ok({ rivals: [] }), targetUserId, viewerId };
    }
    const rivalIds = rivalRows.map((r) => r.userId);

    const [preMonthState, inMonthHistory, allL12SongMeta] = await Promise.all([
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
      monthlyReviewRepo.getAllL12SongMeta(),
    ]);

    const preByUser = new Map<string, Map<number, number>>();
    for (const s of preMonthState) {
      if (s.exScore == null) continue;
      if (!preByUser.has(s.userId)) preByUser.set(s.userId, new Map());
      preByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
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
        allL12SongMeta,
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
