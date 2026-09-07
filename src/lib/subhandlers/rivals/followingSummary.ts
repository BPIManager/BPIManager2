import type { NextApiRequest } from "next";
import { socialComparisonRepo } from "@/lib/db/aggregates/rivalScores/comparison";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, normalizeArr, type HandleOutcome } from "./_shared";

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
    const levelArray = normalizeArr(
      levels as string | string[] | undefined,
    ).map(Number);
    const diffArray = normalizeArr(
      difficulties as string | string[] | undefined,
    );

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
