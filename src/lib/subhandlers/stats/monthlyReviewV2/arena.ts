import { ok, err } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { buildArena } from "@/lib/monthly-review/arena";
import { resolveMonthlyReviewPeriod } from "./_shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsMonthlyReviewArena(q: {
  userId: string;
  version: string;
  month: string;
}): Promise<HandlerResult<unknown>> {
  try {
    const { monthStart, monthEnd } = resolveMonthlyReviewPeriod(q.month);
    const [arenaRows, versionHistoryRows] = await Promise.all([
      monthlyReviewRepo.getMonthlyArenaStats(q.userId, q.version, monthStart, monthEnd),
      monthlyReviewRepo.getArenaVersionHistory(q.userId),
    ]);
    // 「現在」カードと重複しないよう対象バージョン自身は履歴から除く。
    // あくまで各バージョンで最後に取得された時点のスナップショットであり、
    // そのバージョン内での最高到達点ではないことに注意（呼び出し元UIで注記する）
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
