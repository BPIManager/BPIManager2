import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { deleteBatch } from "@/lib/db/orchestrators/batchDeletion";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { authenticateViewer } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import {
  batchDetailGetQuerySchema,
  batchDetailDeleteQuerySchema,
} from "@/schemas/batches/query";
import {
  createOvertakenMap,
  computeRivalRankMap,
  targetOf,
  type HandleOutcome,
} from "./_shared";

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
      navigationRepo.getBatchNavigation(
        uid,
        v,
        targetBatch.createdAt,
        dayRange,
      ),
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
