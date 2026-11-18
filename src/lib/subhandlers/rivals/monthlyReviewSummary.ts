import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";

import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { previousVersionOf } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import { recomputeBpiTimelinesForUsers } from "@/lib/subhandlers/stats/monthlyReviewV2/timeline";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";
import { parseInput } from "@/lib/validation/parse";
import { monthlyReviewRequiredSchema, monthlyReviewValueSchema } from "@/schemas/rivals/monthlyReviewSummary";

export async function handleRivalMonthlyReviewSummary(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const required = parseInput(monthlyReviewRequiredSchema, req.query, {
    in: "query",
    message: "userId, month, version are required",
  });
  if (!required.success) {
    return { result: required.result, targetUserId, viewerId: null };
  }
  const { userId, month, version } = required.data;
  const values = parseInput(monthlyReviewValueSchema, required.data, {
    in: "query",
    message: "Invalid month or version",
  });
  if (!values.success) {
    return { result: values.result, targetUserId, viewerId: null };
  }
  const isAllMode = month === "all";
  const isYearMode = !isAllMode && /^\d{4}$/.test(month);

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

    // 総合BPIは scores.lastPlayed（実プレイ日）基準のシフト法で算出する（computeOwnerBpiTimeline と同じ設計）。
     // userStatusLogs.createdAt は取り込み時刻のため使わない。
    const recomputedByUser = await recomputeBpiTimelinesForUsers(
      rivalIds,
      version as string,
      monthStart,
      monthEnd,
      isYearMode || isAllMode,
      compareVersion,
    );

    const rivals = rivalRows
      .map((r) => {
        const recomputed = recomputedByUser.get(r.userId);
        // compareVersionモードでそのバージョンのスコアが無い＝比較不能として除外
        if (!recomputed || recomputed.bpiStart === null) return null;
        return {
          userId: r.userId,
          userName: r.userName,
          profileImage: r.profileImage,
          bpiStart: recomputed.bpiStart,
          bpiEnd: recomputed.bpiEnd,
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
