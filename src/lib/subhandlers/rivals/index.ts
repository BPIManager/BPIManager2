import type { NextApiRequest } from "next";
import { z } from "zod";
import dayjs from "@/lib/dayjs";
import topElements from "@/constants/iidx/radars/topElements";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { userDiscoveryRepo } from "@/lib/db/aggregates/userProfiles/discovery";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { buildBpiTimeline } from "@/lib/monthly-review/bpi";
import { calculateRadar } from "@/lib/radar/calculator";
import { sortSongs } from "@/utils/songs/sort";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { rivalScoresQuerySchema } from "@/schemas/rivals/query";
import { rivalScoreDetailQuerySchema } from "@/schemas/rivals/rivalId/scores/query";
import {
  rivalFollowingScoresQuerySchema,
  scoreComparisonQuerySchema,
} from "@/schemas/rivals/following/scores/query";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

const radarLookup = new Map<string, string>(
  (topElements as { title: string; difficulty: string; top: string }[]).map(
    (e) => [`${e.title}__${e.difficulty}`, e.top],
  ),
);

function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}
function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}
function normalizeArr(val: string | string[] | undefined): string[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/** GET /users/[userId]/rivals/[rivalId]/scores */
export async function handleRivalScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, version, ...filterParams } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const rivalAccess = await checkProfileAccess(req, rivalId);
    const rivalDenied = accessError(rivalAccess);
    if (rivalDenied) return { result: rivalDenied, targetUserId, viewerId };

    const rawResults = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId,
      version,
    });

    const compared = rawResults
      .map((row) => {
        const myEx = row.myExScore !== null ? Number(row.myExScore) : null;
        const rivalEx =
          row.rivalExScore !== null ? Number(row.rivalExScore) : null;
        const myBpi = row.myBpi !== null ? Number(row.myBpi) : null;
        const rivalBpi = row.rivalBpi !== null ? Number(row.rivalBpi) : null;

        const exDiff = (myEx ?? 0) - (rivalEx ?? 0);
        const bpiDiff =
          Math.round(((myBpi ?? -15) - (rivalBpi ?? -15)) * 100) / 100;

        return {
          songId: row.songId,
          title: row.title || "Unknown Title",
          notes: Number(row.notes || 0),
          bpm: row.bpm || "0",
          difficulty: row.difficulty || "ANOTHER",
          difficultyLevel: Number(row.difficultyLevel || 12),
          releasedVersion: row.releasedVersion || 0,
          wrScore: row.wrScore || null,
          kaidenAvg: row.kaidenAvg || null,
          coef: row.coef || null,

          logId: row.myLogId ? Number(row.myLogId) : null,
          exScore: myEx,
          bpi: myBpi,
          clearState: row.myClearState || "NO PLAY",
          missCount: row.myMissCount !== null ? Number(row.myMissCount) : null,
          scoreAt: row.myLastPlayed || null,

          rival: {
            userId: row.rivalUserId,
            userName: row.rivalUserName,
            exScore: rivalEx,
            bpi: rivalBpi,
            clearState: row.rivalClearState || "NO PLAY",
            missCount:
              row.rivalMissCount !== null ? Number(row.rivalMissCount) : null,
            lastPlayed: row.rivalLastPlayed || null,
          },

          exDiff,
          bpiDiff,
          lastPlayedMax:
            row.myLastPlayed && row.rivalLastPlayed
              ? new Date(row.myLastPlayed) > new Date(row.rivalLastPlayed)
                ? row.myLastPlayed
                : row.rivalLastPlayed
              : row.myLastPlayed || row.rivalLastPlayed || null,
          radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
        };
      })
      .filter(
        (song) => song.exScore !== null || song.rival.exScore !== null,
      );

    const sorted = sortSongs(compared, filterParams);
    return { result: ok(sorted), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/[rivalId]/scores/[songId] （withUserApiHandler） */
export async function handleRivalScoreDetail(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalScoreDetailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, songId, version } = parsed.data;

  try {
    const rivalAccess = await checkProfileAccess(req, String(rivalId));
    const viewerId = rivalAccess.viewerId ?? null;
    const denied = accessError(rivalAccess);
    if (denied) return { result: denied, targetUserId, viewerId };

    const result = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId: String(rivalId),
      version,
    });
    const rivalData = result.find((r) => r.songId === Number(songId));
    if (!rivalData) {
      return {
        result: err(404, "Rival score not found"),
        targetUserId,
        viewerId,
      };
    }

    return {
      result: ok({
        songId: Number(songId),
        version: String(version),
        rival: {
          userId: rivalData.rivalUserId ?? null,
          userName: rivalData.rivalUserName ?? null,
          profileImage: null,
          exScore: rivalData.rivalExScore,
          bpi: rivalData.rivalBpi !== null ? Number(rivalData.rivalBpi) : -15.0,
          clearState: rivalData.rivalClearState,
          lastPlayed: rivalData.rivalLastPlayed,
          metadata: {
            wrScore: rivalData.wrScore,
            kaidenAvg: rivalData.kaidenAvg,
          },
        },
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

const winLossHistoryQuerySchema = z.object({
  userId: z.string().min(1),
  rivalId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
  level: z.coerce
    .number()
    .int()
    .refine((v) => v === 11 || v === 12),
});
type WlOutcome = "win" | "lose" | "draw" | null;
function getOutcome(viewer: number | null, rival: number | null): WlOutcome {
  if (viewer === null || rival === null) return null;
  if (viewer > rival) return "win";
  if (viewer < rival) return "lose";
  return "draw";
}
function outcomeDelta(outcome: WlOutcome): number {
  if (outcome === "win") return 1;
  if (outcome === "lose") return -1;
  return 0;
}

/** GET /users/[userId]/rivals/[rivalId]/win-loss-history */
export async function handleRivalWinLossHistory(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = winLossHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, version, level } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId, viewerId };

    const rivalAccess = await checkProfileAccess(req, rivalId);
    const rivalDenied = accessError(rivalAccess);
    if (rivalDenied) return { result: rivalDenied, targetUserId, viewerId };

    const rows = await socialComparisonRepo.getWinLossHistory(
      userId,
      rivalId,
      version,
      level,
    );
    if (rows.length === 0) return { result: ok([]), targetUserId, viewerId };

    const toJSTDate = (date: Date | string) =>
      dayjs(date).tz().format("YYYY-MM-DD");

    const byDate = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!row.lastPlayed) continue;
      const date = toJSTDate(row.lastPlayed);
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(row);
    }

    const sortedDates = Array.from(byDate.keys()).sort();
    const songState = new Map<
      number,
      { viewer: number | null; rival: number | null }
    >();
    let cumulative = 0;
    const result: { date: string; delta: number; cumulative: number }[] = [];

    for (const date of sortedDates) {
      const updates = byDate.get(date)!;
      let dailyDelta = 0;
      for (const update of updates) {
        const state = songState.get(update.songId) ?? {
          viewer: null,
          rival: null,
        };
        const oldOutcome = getOutcome(state.viewer, state.rival);
        if (update.userId === userId) {
          state.viewer = update.exScore;
        } else {
          state.rival = update.exScore;
        }
        songState.set(update.songId, state);
        const newOutcome = getOutcome(state.viewer, state.rival);
        dailyDelta += outcomeDelta(newOutcome) - outcomeDelta(oldOutcome);
      }
      cumulative += dailyDelta;
      result.push({ date, delta: dailyDelta, cumulative });
    }

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/following/avg-scores （withAuth） */
export async function handleRivalFollowingAvgScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };

  const { version, songIds: songIdsRaw } = req.query;
  if (!version || typeof version !== "string") {
    return {
      result: err(400, "userId and version are required"),
      ...base,
    };
  }
  const songIds =
    songIdsRaw && typeof songIdsRaw === "string"
      ? songIdsRaw
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

  try {
    const rows = await rivalRepo.getRivalAvgScores({ userId, version, songIds });
    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      avgExScore: row.avgExScore !== null ? Number(row.avgExScore) : null,
      avgBpi: row.avgBpi !== null ? Number(row.avgBpi) : null,
      rivalCount: Number(row.rivalCount),
    }));
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /users/[userId]/rivals/following/list */
export async function handleRivalFollowingList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  if (!targetUserId) {
    return {
      result: err(400, "userId is required"),
      targetUserId,
      viewerId: null,
    };
  }
  try {
    const access = await checkUserAccess(req, targetUserId);
    const viewerId = access.viewerId ?? null;
    if (!access.user) {
      return { result: err(401, "Unauthorized"), targetUserId, viewerId };
    }
    const rivals =
      await followListAggregateRepo.getPublicFollowingUsers(targetUserId);
    return { result: ok({ rivals }), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/rivals/following/monthly-review-summary */
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
export async function handleRivalFollowingScoresList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };

  const parsed = scoreComparisonQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      ...base,
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
    };
  }
  const {
    version,
    limit,
    lastDiff,
    lastSongId,
    lastRivalId,
    levels,
    difficulties,
    minDiff,
    maxDiff,
  } = parsed.data;

  try {
    const levelArray = normalizeArr(levels as unknown as string[]).map(Number);
    const diffArray = normalizeArr(difficulties as unknown as string[]);
    const nMin = minDiff !== undefined ? Number(minDiff) : 1;
    const nMax = maxDiff !== undefined ? Number(maxDiff) : 30;
    const nLimit = limit ? Number(limit) : 10;

    const cursor =
      lastDiff && lastSongId && lastRivalId
        ? {
            lastDiff: Number(lastDiff),
            lastSongId: String(lastSongId),
            lastRivalId: String(lastRivalId),
          }
        : undefined;

    const rawResults = await rivalRepo.getScoreComparisonList({
      userId: String(userId),
      version,
      limit: nLimit,
      minDiff: nMin,
      maxDiff: nMax,
      cursor,
      levelArray,
      diffArray,
    });

    const items = rawResults.map((row) => {
      const item = {
        songId: Number(row.songId),
        title: row.title,
        notes: Number(row.notes),
        bpm: row.bpm,
        difficulty: row.difficulty,
        difficultyLevel: Number(row.difficultyLevel),
        releasedVersion: row.releasedVersion
          ? Number(row.releasedVersion)
          : null,
        logId: row.logId ? Number(row.logId) : null,
        exScore: row.exScore !== null ? Number(row.exScore) : null,
        bpi: row.bpi !== null ? Number(row.bpi) : null,
        clearState: row.clearState || "NO PLAY",
        missCount: row.missCount !== null ? Number(row.missCount) : null,
        scoreAt: row.scoreAt || null,
        wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
        kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
        coef: row.coef !== null ? Number(row.coef) : null,
        exDiff: Number(row.exDiff),
      };
      return {
        ...item,
        rival: {
          userId: row.rivalId,
          userName: row.rivalName,
          profileImage: row.rivalImage,
          exScore: Number(row.rivalEx),
        },
      };
    });

    const lastItem = rawResults[rawResults.length - 1];
    const nextCursor = lastItem
      ? {
          lastDiff: Number(lastItem.exDiff),
          lastSongId: String(lastItem.songId),
          lastRivalId: String(lastItem.rivalId),
        }
      : null;

    return { ...base, result: ok({ items, nextCursor }) };
  } catch (error: unknown) {
    return { ...base, result: err(500, toErrorMessage(error)) };
  }
}

/** GET /users/[userId]/rivals/following/scores/[songId] （withUserApiHandler） */
export async function handleRivalFollowingScoresForSong(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalFollowingScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, songId, version } = parsed.data;

  try {
    const rivalsScores = await rivalRepo.getFollowedScoresForSong({
      viewerId: String(userId),
      songId: Number(songId),
      version,
    });
    return {
      result: ok({
        songId: Number(songId),
        version: String(version),
        rivals: rivalsScores.map(formatRivalScore),
      }),
      targetUserId,
      viewerId: targetUserId || null,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

export const formatRivalScore = (
  r: Awaited<
    ReturnType<typeof rivalRepo.getFollowedScoresForSong>
  >[number],
) => ({
  userId: r.userId,
  userName: r.userName,
  profileImage: r.profileImage,
  exScore: r.exScore,
  bpi: r.bpi !== null ? Number(r.bpi) : -15.0,
  clearState: r.clearState,
  lastPlayed: r.lastPlayed,
  metadata: {
    wrScore: r.wrScore,
    kaidenAvg: r.kaidenAvg,
  },
});

/** GET /users/[userId]/rivals/following/summary （withAuth） */
export async function handleRivalFollowingSummary(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = authUidOf(req);
  const base = { targetUserId: viewerId, viewerId };
  const { version, levels, difficulties, listId } = req.query;
  if (!version) {
    return { result: err(400, "version is required"), ...base };
  }

  try {
    const levelArray = normalizeArr(levels as string | string[] | undefined).map(
      Number,
    );
    const diffArray = normalizeArr(difficulties as string | string[] | undefined);

    let listIdFilter: number | undefined;
    if (typeof listId === "string" && listId !== "") {
      const parsedListId = Number(listId);
      const list = await followListsRepo.getById(parsedListId);
      if (!list || list.userId !== viewerId) {
        return { result: err(404, "List not found"), ...base };
      }
      listIdFilter = parsedListId;
    }

    const [summary, viewerBpiRecord] = await Promise.all([
      socialComparisonRepo.getFollowedWinLossSummary({
        viewerId,
        version: version as string,
        levels: levelArray,
        difficulties: diffArray,
        listId: listIdFilter,
      }),
      navigationRepo.getLatestTotalBpi(viewerId, version as string),
    ]);

    return {
      result: ok({
        rivals: summary,
        viewerBpi: viewerBpiRecord ? Number(viewerBpiRecord.totalBpi) : -15,
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /users/[userId]/rivals/following/top-scores （withAuth） */
export async function handleRivalFollowingTopScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const userId = authUidOf(req);
  const base = { targetUserId: userId, viewerId: userId };
  const { version, songIds: songIdsRaw } = req.query;
  if (!version || typeof version !== "string") {
    return { result: err(400, "userId and version are required"), ...base };
  }
  const songIds =
    songIdsRaw && typeof songIdsRaw === "string"
      ? songIdsRaw
          .split(",")
          .map(Number)
          .filter((n) => !isNaN(n) && n > 0)
      : undefined;

  try {
    const rows = await rivalRepo.getRivalTopScores({ userId, version, songIds });
    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      topExScore: row.topExScore !== null ? Number(row.topExScore) : null,
      topBpi: row.topBpi !== null ? Number(row.topBpi) : null,
      rivalCount: Number(row.rivalCount),
    }));
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /users/[userId]/rivals/suggestions （withAuth） */
export async function handleRivalSuggestions(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = authUidOf(req);
  const base = { targetUserId: viewerId, viewerId };

  const { q, p, s, o, seed } = req.query;
  const currentPage = Math.max(1, Number(p || 1));
  const orderMode =
    (o as "distance" | "desc" | "newest" | "supporters") || "distance";
  const limit = orderMode === "supporters" ? 1000 : 20;
  const offset =
    orderMode === "supporters" ? 0 : (currentPage - 1) * limit;
  const sortKey = (s as string) || "totalBpi";

  try {
    const version = latestVersion;
    const viewerScores = await statsTablesRepo.getLatestScoresWithMusicData(
      viewerId,
      version,
    );
    const viewerRadar = calculateRadar(viewerScores);

    let viewerBaseValue: number;
    if (sortKey === "totalBpi") {
      const record = await navigationRepo.getLatestTotalBpi(viewerId, version);
      viewerBaseValue = record ? record.totalBpi : -15;
    } else {
      const category = sortKey.toUpperCase() as keyof typeof viewerRadar;
      viewerBaseValue = viewerRadar[category]?.totalBpi ?? -15;
    }
    const parsedSeed = seed ? Number(seed) : undefined;
    const recommendedUsers = await userDiscoveryRepo.getRecommendedUsers({
      viewerId,
      viewerValue: viewerBaseValue,
      version,
      limit,
      offset,
      searchQuery: q as string,
      sort: sortKey,
      order: orderMode,
      seed: parsedSeed,
    });

    return {
      result: ok({
        viewer: {
          userId: viewerId,
          totalBpi: viewerBaseValue,
          radar: viewerRadar,
        },
        users: recommendedUsers.map((user) => ({
          userId: user.userId,
          iidxId: user.iidxId,
          userName: user.userName,
          profileImage: user.profileImage,
          profileText: user.profileText,
          arenaClass: user.arenaClass ?? null,
          totalBpi: Number(user.totalBpi),
          updatedAt: user.createdAt,
          role: user.role
            ? {
                role: user.role,
                description: user.description ?? "",
                grantedAt: user.grantedAt,
              }
            : null,
          radar: {
            NOTES: Number(user.notes),
            CHORD: Number(user.chord),
            PEAK: Number(user.peak),
            CHARGE: Number(user.charge),
            SCRATCH: Number(user.scratch),
            SOFLAN: Number(user.soflan),
          },
        })),
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
