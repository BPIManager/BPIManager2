import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { followListAggregateRepo } from "@/lib/db/aggregates/followList";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, targetOf, normalizeArr, type HandleOutcome } from "./_shared";

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
