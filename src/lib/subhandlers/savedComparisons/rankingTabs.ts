import type { NextApiRequest } from "next";
import { savedComparisonsRepo } from "@/lib/db/domains/savedComparisons";
import { dashboardRankingTabsRepo } from "@/lib/db/domains/dashboardRankingTabs";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { rankingTabsBodySchema } from "@/schemas/savedComparisons";
import { authUidOf, type HandleOutcome } from "./_shared";

const SAVED_PREFIX = "saved:";

/** GET /users/[userId]/dashboard-ranking-tabs （行が無ければ tabs は空＝既定の並び） */
export async function handleRankingTabsGet(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const rows = await dashboardRankingTabsRepo.getAllForUser(uid);
    const tabs = rows.map((r) => ({
      key: r.savedComparisonId !== null ? `${SAVED_PREFIX}${r.savedComparisonId}` : r.tabKey,
      visible: r.visible,
      targetIndex: r.targetIndex,
    }));
    return { result: ok({ tabs }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}

/** PUT /users/[userId]/dashboard-ranking-tabs （配列の順序を並び順として全置換） */
export async function handleRankingTabsPut(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const parsed = rankingTabsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const savedIds = parsed.data.tabs
      .filter((t) => t.key.startsWith(SAVED_PREFIX))
      .map((t) => Number(t.key.slice(SAVED_PREFIX.length)));
    const owned = await savedComparisonsRepo.getOwnedIds(uid, savedIds);
    if (savedIds.some((id) => !owned.has(id))) {
      return { result: err(400, "Unknown saved comparison"), targetUserId: uid, viewerId: uid };
    }

    await dashboardRankingTabsRepo.replaceAll(
      uid,
      parsed.data.tabs.map((t) =>
        t.key.startsWith(SAVED_PREFIX)
          ? {
              tabKey: null,
              savedComparisonId: Number(t.key.slice(SAVED_PREFIX.length)),
              visible: t.visible,
              targetIndex: t.targetIndex ?? 0,
            }
          : { tabKey: t.key, savedComparisonId: null, visible: t.visible, targetIndex: 0 },
      ),
    );
    return { result: ok({ status: "saved" }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId: uid, viewerId: uid };
  }
}
