import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { StepQuery } from "./_shared";

export async function handleStatsScoreRateDistribution(
  q: StepQuery,
): Promise<HandlerResult<unknown>> {
  const { userId, version, levels, difficulties, step } = q;
  const scores = await statsTablesRepo.getLatestScoresWithMusicData(
    userId,
    version,
  );
  const distribution: { label: string; count: number }[] = [];
  for (let v = 0; v < 100; v += step) {
    distribution.push({ label: v.toString(), count: 0 });
  }
  distribution.push({ label: "100", count: 0 });

  scores.forEach((s) => {
    if (!s.exScore || s.exScore <= 0) return;
    if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
      return;
    if (
      difficulties.length > 0 &&
      !difficulties.includes(s.difficulty as string)
    )
      return;
    const maxScore = (s.notes || 0) * 2;
    if (maxScore === 0) return;
    const rate = (s.exScore / maxScore) * 100;
    const idx = Math.min(Math.floor(rate / step), distribution.length - 1);
    if (distribution[idx]) distribution[idx].count++;
  });
  return ok(distribution);
}
