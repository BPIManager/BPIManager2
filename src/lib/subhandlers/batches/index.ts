import { z } from "zod";
import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { scoreTimelineRepo } from "@/lib/db/aggregates/scoreTimeline";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { scoresRepo } from "@/lib/db/domains/scores";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { deleteBatch } from "@/lib/db/orchestrators/batchDeletion";
import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import {
  batchesQuerySchema,
  batchDetailGetQuerySchema,
  batchDetailDeleteQuerySchema,
  batchScoresQuerySchema,
} from "@/schemas/batches/query";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";
import type { IIDXVersion } from "@/types/iidx/version";
import type { OvertakenMap } from "@/types/logs/overtaken";

/**
 * batches ドメイン（`users/[userId]/batches/**`）の subhandler 群。
 * ビジネスロジックを「`res` へ書き込む」形から切り離し、正規化した
 * `HandlerResult` を返す。v1/v2 のルートから共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/* -------------------------------------------------------------------------- */
/* 追い抜きライバル関連ヘルパー（旧 batches/[batchId]/scores.ts から移設）      */
/* -------------------------------------------------------------------------- */

export function computeRivalRankMap(
  overtakenMap: OvertakenMap,
  rivalScores: { songId: number | null; exScore: number | null }[],
): Record<
  number,
  { myRankBefore: number; myRankAfter: number; totalRivals: number }
> {
  const scoresBySong: Record<number, number[]> = {};
  for (const row of rivalScores) {
    if (row.songId == null || row.exScore == null) continue;
    if (!scoresBySong[row.songId]) scoresBySong[row.songId] = [];
    scoresBySong[row.songId].push(row.exScore);
  }

  const result: Record<
    number,
    { myRankBefore: number; myRankAfter: number; totalRivals: number }
  > = {};
  for (const [songIdStr, rivals] of Object.entries(overtakenMap)) {
    const songId = Number(songIdStr);
    const myOldScore = rivals[0]?.myOldScore ?? null;
    const myNewScore = rivals[0]?.myNewScore ?? 0;
    const allScores = scoresBySong[songId] ?? [];
    const totalRivals = allScores.length;
    result[songId] = {
      myRankBefore:
        myOldScore !== null
          ? allScores.filter((s) => s > myOldScore).length + 1
          : totalRivals + 1,
      myRankAfter: allScores.filter((s) => s > myNewScore).length + 1,
      totalRivals,
    };
  }
  return result;
}

export function createOvertakenMap(
  overtakenList: Awaited<ReturnType<typeof rivalRepo.getOvertakenRivals>>,
): OvertakenMap {
  return overtakenList.reduce<OvertakenMap>((acc, curr) => {
    if (!curr.songId) return acc;
    if (!acc[curr.songId]) acc[curr.songId] = [];
    acc[curr.songId].push({
      rivalUserId: curr.rivalUserId,
      rivalName: curr.rivalName,
      rivalProfileImage: curr.rivalProfileImage,
      rivalScore: curr.rivalScore,
      myNewScore: curr.myNewScore,
      myOldScore: curr.myOldScore,
    });
    return acc;
  }, {});
}

/**
 * 追い抜きライバル取得の完了を待ってから、その楽曲群のライバル最新スコアを取得する。
 * overtakenPromise 自体は他のクエリと独立なため、呼び出し元で Promise.all に含めることで
 * history/totalSongs/scores 取得と並行させ、直列 await を避ける。
 */
async function fetchRivalScoresForOvertaken(
  overtakenPromise: Promise<
    Awaited<ReturnType<typeof rivalRepo.getOvertakenRivals>>
  >,
  uid: string,
  ver: IIDXVersion,
  isOwnLog: boolean,
) {
  const overtaken = await overtakenPromise;
  const overtakenSongIds = Object.keys(createOvertakenMap(overtaken))
    .map(Number)
    .filter(Boolean);

  return isOwnLog && overtakenSongIds.length > 0
    ? rivalRepo.getRivalLatestScoresBySong({
        userId: uid,
        version: ver,
        songIds: overtakenSongIds,
      })
    : [];
}

/** プレイ日時ベースの詳細取得 */
async function handleLastPlayedBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof navigationRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof navigationRepo.getRangeNavigation>>,
  isOwnLog: boolean,
  type: string = "day",
) {
  const overtakenPromise = isOwnLog
    ? rivalRepo.getOvertakenRivals(uid, ver, {
        range: { ...range, basis: "lastPlayed" },
      })
    : Promise.resolve([]);
  const rivalScoresPromise = fetchRivalScoresForOvertaken(
    overtakenPromise,
    uid,
    ver,
    isOwnLog,
  );

  const [history, totalSongs, dailyScores, overtaken, rivalScores] =
    await Promise.all([
      statsTablesRepo.getScoreHistory(uid, ver, [], []),
      statsTablesRepo.getTotalSongCount([12], []),
      type === "day"
        ? scoreDetailRepo.getScoresByLastPlayedRange(uid, ver, range)
        : scoreDetailRepo.getScoresWithDetails(uid, ver, {
            onlyLastPlayedInRange: range,
          }),
      overtakenPromise,
      rivalScoresPromise,
    ]);

  if (dailyScores.length === 0) {
    throw new Error("No activity found for this period.");
  }

  const overtakenMap = createOvertakenMap(overtaken);
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  const timeline = calculateTotalBpi(history, totalSongs, ver, 0);
  const currentSnapshot = timeline.find((t) => t.id === range.label);
  const currentIndex = timeline.findIndex((t) => t.id === range.label);
  const nextSnapshot = timeline[currentIndex - 1];
  // For week/month: find the last snapshot before the period start, not just the adjacent day
  const prevSnapshot =
    type === "day"
      ? timeline[currentIndex + 1]
      : timeline.find(
          (t) => t.id < dayjs(range.start).tz().format("YYYY-MM-DD"),
        );

  // 週・月単位のナビゲーション用に nav の実際の日付を優先して使用する
  const prevNavDate =
    (nav.prevDate as { lastPlayed?: Date } | null)?.lastPlayed ?? null;
  const nextNavDate =
    (nav.nextDate as { lastPlayed?: Date } | null)?.lastPlayed ?? null;

  return {
    songs: dailyScores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: overtakenMap[s.songId] || [],
        rivalRankInfo: rivalRankMap[s.songId] ?? null,
      };
    }),
    pagination: {
      prev: {
        batchId: prevNavDate
          ? dayjs(prevNavDate).format("YYYY-MM-DD")
          : "previous",
        createdAt: prevNavDate ?? prevSnapshot?.createdAt ?? null,
        totalBpi: prevSnapshot?.totalBpi ?? -15,
      },
      current: {
        batchId: range.label,
        createdAt: range.end,
        totalBpi: currentSnapshot?.totalBpi ?? -15,
        label: `${range.label} のプレイ履歴`,
      },
      next: {
        batchId: nextNavDate ? dayjs(nextNavDate).format("YYYY-MM-DD") : "next",
        createdAt: nextNavDate ?? nextSnapshot?.createdAt ?? null,
        totalBpi: nextSnapshot?.totalBpi ?? -15,
      },
      groupedBy: "lastPlayed",
    },
  };
}

/** インポート日時(バッチ)ベースの詳細取得 */
async function handleCreatedAtBase(
  uid: string,
  ver: IIDXVersion,
  range: ReturnType<typeof navigationRepo.getJstRange>,
  nav: Awaited<ReturnType<typeof navigationRepo.getRangeNavigation>>,
  isOwnLog: boolean,
  type: string = "day",
) {
  const batches = await navigationRepo.findBatchesInRange(
    uid,
    ver,
    range.start,
    range.end,
  );
  if (batches.length === 0) throw new Error("No logs found.");

  const overtakenPromise = isOwnLog
    ? rivalRepo.getOvertakenRivals(uid, ver, {
        range: { ...range, basis: "createdAt" },
      })
    : Promise.resolve([]);
  const rivalScoresPromise = fetchRivalScoresForOvertaken(
    overtakenPromise,
    uid,
    ver,
    isOwnLog,
  );

  const [scores, overtaken, rivalScores] = await Promise.all([
    type === "day"
      ? scoreDetailRepo.getScoresWithDetails(uid, ver, {
          batchIds: batches.map((b) => b.batchId),
          comparisonTime: batches[0].createdAt,
        })
      : scoreDetailRepo.getScoresWithDetails(uid, ver, {
          batchIds: batches.map((b) => b.batchId),
        }),
    overtakenPromise,
    rivalScoresPromise,
  ]);
  const overtakenMap = createOvertakenMap(overtaken);
  const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

  return {
    songs: scores.map((s) => {
      const mapped = mapToLogNested(s);
      return {
        ...mapped,
        overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
        rivalRankInfo: s.songId ? (rivalRankMap[s.songId] ?? null) : null,
      };
    }),
    pagination: {
      prev: nav.prevDate,
      current: {
        ...batches[batches.length - 1],
        count: batches.length,
      },
      next: nav.nextDate,
      groupedBy: "createdAt",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* subhandler                                                                */
/* -------------------------------------------------------------------------- */

/** GET /users/[userId]/batches （withUserApiHandler） */
export async function handleBatchesList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = batchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { userId, version, groupedBy, topN } = parsed.data;

  try {
    if (groupedBy === "lastPlayed") {
      const [history, totalSongs12] = await Promise.all([
        statsTablesRepo.getScoreHistory(userId, version, [], []),
        statsTablesRepo.getTotalSongCount([12], []),
      ]);
      const timeline = calculateTotalBpi(history, totalSongs12, version, topN);
      return { result: ok(timeline), targetUserId, viewerId };
    }

    const timeline = await scoreTimelineRepo.getTimelineByBatches({
      userId,
      version,
      topN,
    });
    return { result: ok(timeline), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/batches/[batchId] */
export async function handleBatchDetail(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const parsed = batchDetailGetQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const { userId: uid, batchId: bid, version: v } = parsed.data;

  try {
    const access = await checkProfileAccess(req, uid);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: uid, viewerId };

    const targetBatch = await navigationRepo.findBatchById(bid);
    if (!targetBatch) {
      return {
        result: err(404, "Batch not found."),
        targetUserId: uid,
        viewerId,
      };
    }

    const jstDate = dayjs.utc(targetBatch.createdAt).tz().format("YYYY-MM-DD");
    const dayRange = navigationRepo.getJstRange(jstDate, "day");
    const isOwnLog = access.viewerId === uid;

    const [nav, sameDay, scores, overtaken] = await Promise.all([
      navigationRepo.getBatchNavigation(uid, v, targetBatch.createdAt, dayRange),
      navigationRepo.findBatchesInRange(uid, v, dayRange.start, dayRange.end),
      scoreDetailRepo.getScoresWithDetails(uid, v, { batchIds: [bid] }),
      isOwnLog
        ? rivalRepo.getOvertakenRivals(uid, v, {
            batchId: bid,
            range: { ...dayRange, basis: "createdAt" },
          })
        : [],
    ]);

    const overtakenMap = createOvertakenMap(overtaken);
    const overtakenSongIds = Object.keys(overtakenMap)
      .map(Number)
      .filter(Boolean);
    const rivalScores =
      isOwnLog && overtakenSongIds.length > 0
        ? await rivalRepo.getRivalLatestScoresBySong({
            userId: uid,
            version: v,
            songIds: overtakenSongIds,
          })
        : [];
    const rivalRankMap = computeRivalRankMap(overtakenMap, rivalScores);

    return {
      result: ok({
        songs: scores.map((s) => {
          const mapped = mapToLogNested(s);
          return {
            ...mapped,
            overtaken: s.songId ? overtakenMap[s.songId] || [] : [],
            rivalRankInfo: s.songId ? (rivalRankMap[s.songId] ?? null) : null,
          };
        }),
        pagination: {
          ...nav,
          current: targetBatch,
          dailyBatchIds: sameDay.map((b) => b.batchId),
          dailyBatchCount: sameDay.length,
        },
      }),
      targetUserId: uid,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

/** DELETE /users/[userId]/batches/[batchId] （本人のみ） */
export async function handleBatchDelete(
  req: NextApiRequest,
): Promise<HandleOutcome<{ message: string }>> {
  const parsed = batchDetailDeleteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const { userId: uid, batchId: bid } = parsed.data;

  try {
    const viewerId = (await authenticateViewer(req)) ?? null;
    if (!viewerId || viewerId !== uid) {
      return { result: err(403, "Forbidden"), targetUserId: uid, viewerId };
    }

    const targetBatch = await navigationRepo.findBatchByIdAndUser(bid, uid);
    if (!targetBatch) {
      return {
        result: err(404, "Batch not found."),
        targetUserId: uid,
        viewerId,
      };
    }

    await deleteBatch(uid, bid);

    return {
      result: ok({ message: "Batch deleted successfully." }),
      targetUserId: uid,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/batches/[batchId]/scores （batchId は日付文字列） */
export async function handleBatchScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const parsed = batchScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const {
    userId: uid,
    batchId: dateStr,
    version: ver,
    type,
    groupedBy,
  } = parsed.data;

  try {
    const access = await checkProfileAccess(req, uid);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: uid, viewerId };

    const basis: "lastPlayed" | "createdAt" =
      groupedBy === "lastPlayed" ? "lastPlayed" : "createdAt";

    const range = navigationRepo.getJstRange(dateStr, type);
    const nav = await navigationRepo.getRangeNavigation(uid, ver, range, basis);

    const isOwnLog = access.viewerId === uid;

    const responseData =
      groupedBy === "lastPlayed"
        ? await handleLastPlayedBase(uid, ver, range, nav, isOwnLog, type)
        : await handleCreatedAtBase(uid, ver, range, nav, isOwnLog, type);

    return {
      result: ok({
        ...responseData,
        range: { start: range.start, end: range.end, unit: type },
      }),
      targetUserId: uid,
      viewerId,
    };
  } catch (error: unknown) {
    console.error(`Fetch Detail Error:`, error);
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

const versionSummaryQuerySchema = z.object({
  userId: z.string().min(1),
  version: z.enum(IIDX_VERSIONS),
});

/** GET /users/[userId]/batches/version-summary */
export async function handleVersionSummary(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const parsed = versionSummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const { userId, version } = parsed.data;

  try {
    const access = await checkProfileAccess(req, userId);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: userId, viewerId };

    const compareVersion = await scoresRepo.getPreviousVersionWithScores(
      userId,
      version,
    );

    if (!compareVersion) {
      return {
        result: ok({
          songs: [],
          currentVersion: version,
          compareVersion: null,
          compareVersionLabel: null,
        }),
        targetUserId: userId,
        viewerId,
      };
    }

    const rows = await timelineRepo.getSelfVersionScores({
      userId,
      currentVersion: version,
      targetVersion: compareVersion,
    });

    const songs = rows.map((row) => {
      const myEx =
        row.myExScore !== null && row.myExScore !== undefined
          ? Number(row.myExScore)
          : null;
      const prevEx =
        row.prevExScore !== null && row.prevExScore !== undefined
          ? Number(row.prevExScore)
          : null;
      const myBpi =
        row.myBpi !== null && row.myBpi !== undefined ? Number(row.myBpi) : null;
      const prevBpi =
        row.prevBpi !== null && row.prevBpi !== undefined
          ? Number(row.prevBpi)
          : null;

      const exDiff =
        myEx !== null && prevEx !== null
          ? myEx - prevEx
          : myEx !== null
            ? myEx
            : 0;
      const bpiDiff =
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : myBpi !== null
            ? Math.round((myBpi + 15) * 100) / 100
            : 0;

      return {
        songId: Number(row.songId),
        title: row.title,
        notes: Number(row.notes),
        bpm: row.bpm,
        difficulty: row.difficulty,
        difficultyLevel: Number(row.difficultyLevel),
        level: Number(row.difficultyLevel),
        releasedVersion: row.releasedVersion
          ? Number(row.releasedVersion)
          : null,
        current:
          myEx !== null
            ? {
                exScore: myEx,
                bpi: myBpi ?? -15,
                clearState: row.myClearState ?? null,
                missCount:
                  row.myMissCount !== null && row.myMissCount !== undefined
                    ? Number(row.myMissCount)
                    : null,
                lastPlayedAt: row.myLastPlayed ?? null,
              }
            : null,
        previous:
          prevEx !== null
            ? {
                exScore: prevEx,
                bpi: prevBpi ?? -15,
                clearState: row.prevClearState ?? null,
                missCount:
                  row.prevMissCount !== null && row.prevMissCount !== undefined
                    ? Number(row.prevMissCount)
                    : null,
              }
            : null,
        diff: { exScore: exDiff, bpi: bpiDiff },
        wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
        kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
        coef: row.coef !== null ? Number(row.coef) : null,
        overtaken: [],
        rivalRankInfo: null,
      };
    });

    return {
      result: ok({
        songs,
        currentVersion: version,
        compareVersion,
        compareVersionLabel: getVersionNameFromNumber(compareVersion),
      }),
      targetUserId: userId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId: null,
    };
  }
}
