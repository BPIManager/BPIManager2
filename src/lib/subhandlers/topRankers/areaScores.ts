import type { NextApiRequest } from "next";
import { topRankersAreaScoresRepo } from "@/lib/db/aggregates/topRankers/areaScores";
import { BpiCalculator } from "@/lib/bpi";

import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import { targetOf, type HandleOutcome } from "./_shared";
import { parseInput } from "@/lib/validation/parse";
import { topRankersAreaScoresQuerySchema } from "@/schemas/topRankers/query";

export interface TopRankerAreaScoreRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  topExScore: number;
  topBpi: number | null;
}

/** GET /users/[userId]/top-rankers/area-scores?version=33&areaId=27 */
export async function handleTopRankersAreaScores(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<TopRankerAreaScoreRow[]>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const q = parseInput(topRankersAreaScoresQuerySchema, req.query, {
    in: "query",
    message: "Invalid version or areaId",
  });
  if (!q.success) {
    return { result: q.result, targetUserId, viewerId };
  }
  const { version, areaId } = q.data;

  try {
    const rows = await topRankersAreaScoresRepo.getAreaScores(version, areaId);
    const body = rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      difficultyLevel: r.difficultyLevel,
      topExScore: r.exScore,
      topBpi:
        r.wrScore != null && r.kaidenAvg != null
          ? BpiCalculator.calc(r.exScore, {
              notes: Number(r.notes),
              kaidenAvg: r.kaidenAvg,
              wrScore: r.wrScore,
              coef: r.coef,
              mu: r.mu,
              sigma: r.sigma,
              residualVar: r.residualVar,
            })
          : null,
    }));
    return { result: ok(body), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
