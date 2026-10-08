import type { NextApiRequest } from "next";
import { topRankersSummaryRepo } from "@/lib/db/aggregates/topRankers/summary";
import { usersRepo } from "@/lib/db/domains/users";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import { targetOf, type HandleOutcome, type TopRankersSummary } from "./_shared";
import { normalizeIidxId } from "./iidxId";

/** GET /users/[userId]/top-rankers/summary */
export async function handleTopRankersSummary(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<TopRankersSummary>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  try {
    const iidxId = normalizeIidxId((await usersRepo.getIidxId(targetUserId))?.iidxId);
    if (!iidxId) {
      return {
        result: ok({ hasIidxId: false, counts: [] }),
        targetUserId,
        viewerId,
      };
    }
    const counts = await topRankersSummaryRepo.getAreaCounts(iidxId);
    return { result: ok({ hasIidxId: true, counts }), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
