import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyActivityRepo } from "@/lib/db/aggregates/monthly-review/activity";
import { buildArena } from "@/lib/monthly-review/arena";
import { resolveMonthlyReviewPeriod } from "@/lib/subhandlers/stats/monthlyReviewV2/period";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewArena(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd } = resolveMonthlyReviewPeriod(q.month);
    const [arenaRows, versionHistoryRows] = await Promise.all([
      monthlyActivityRepo.getMonthlyArenaStats(q.userId, q.version, monthStart, monthEnd),
      monthlyActivityRepo.getArenaVersionHistory(q.userId),
    ]);
    // 対象バージョン自身は「現在」カードと重複するため履歴から除く。各バージョンで最後に取得された時点のスナップショットであり、最高到達点ではない（UI で注記する）。
    const versionHistory = versionHistoryRows
      .filter((r) => r.version !== q.version)
      .map((r) => ({
        version: r.version,
        arenaClass: r.arenaClass,
        arenaRank: r.arenaRank,
      }));
    return ok({ arena: buildArena(arenaRows), versionHistory });
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
