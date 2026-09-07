import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { ok } from "@/middlewares/api/apiResult";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

export async function handleStatsDjRankDistribution(
  q: StatsQuery,
): Promise<HandlerResult<unknown>> {
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    q.userId,
    q.version,
  );
  const distribution = RANK_TABLE.map((r) => ({ label: r.label, count: 0 }));
  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (q.levels.length > 0 && !q.levels.includes(s.difficultyLevel as number))
      return;
    if (
      q.difficulties.length > 0 &&
      !q.difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rankIdx = RANK_TABLE.findLastIndex(
      (r) => s.exScore / maxScore >= r.ratio,
    );
    if (rankIdx !== -1) distribution[rankIdx].count++;
  });
  return ok(distribution);
}
