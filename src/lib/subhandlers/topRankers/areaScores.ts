import type { NextApiRequest } from "next";
import { topRankersAreaScoresRepo } from "@/lib/db/aggregates/topRankers/areaScores";
import { BpiCalculator } from "@/lib/bpi";
import {
  TOP_RANKER_AREA_NAMES,
  TOP_RANKER_VERSIONS,
} from "@/constants/iidx/topRankerAreas";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import { targetOf, type HandleOutcome } from "./_shared";

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

  const { version } = req.query;
  const areaId = Number(req.query.areaId);
  if (
    typeof version !== "string" ||
    !(TOP_RANKER_VERSIONS as readonly string[]).includes(version) ||
    !Number.isInteger(areaId) ||
    areaId < 0 ||
    areaId >= TOP_RANKER_AREA_NAMES.length
  ) {
    return {
      result: err(400, "Invalid version or areaId"),
      targetUserId,
      viewerId,
    };
  }

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
