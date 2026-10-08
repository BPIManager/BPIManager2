import type { NextApiRequest } from "next";
import { topRankersListRepo } from "@/lib/db/aggregates/topRankers/list";
import { usersRepo } from "@/lib/db/domains/users";
import { BpiCalculator } from "@/lib/bpi";
import { TOP_RANKER_VERSIONS } from "@/constants/iidx/topRankerAreas";
import { IIDX_LEVELS } from "@/constants/iidx/bpiDifficulties";
import { radarTopOf } from "@/constants/iidx/radars/topElements";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { SongWithScore } from "@/types/songs/score";
import { targetOf, type HandleOutcome } from "./_shared";
import { normalizeIidxId } from "./iidxId";

/** GET /users/[userId]/top-rankers?version=33 */
export async function handleTopRankersList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<SongWithScore[]>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const version = req.query.version;
  if (
    typeof version !== "string" ||
    !(TOP_RANKER_VERSIONS as readonly string[]).includes(version)
  ) {
    return { result: err(400, "Invalid version"), targetUserId, viewerId };
  }

  try {
    const iidxId = normalizeIidxId((await usersRepo.getIidxId(targetUserId))?.iidxId);
    if (!iidxId) return { result: ok([]), targetUserId, viewerId };

    const rows = await topRankersListRepo.getListByVersion(iidxId, version);
    const songs: SongWithScore[] = rows.map((r) => {
      const notes = Number(r.notes);
      const hasBpiTarget = IIDX_LEVELS.includes(String(r.difficultyLevel) as never);
      const bpi =
        hasBpiTarget && r.wrScore != null && r.kaidenAvg != null
          ? BpiCalculator.calc(r.exScore, {
              notes,
              kaidenAvg: r.kaidenAvg,
              wrScore: r.wrScore,
              coef: r.coef,
              mu: r.mu,
              sigma: r.sigma,
              residualVar: r.residualVar,
            })
          : undefined;
      return {
        songId: r.songId,
        title: r.title,
        notes,
        bpm: r.bpm,
        difficulty: r.difficulty,
        difficultyLevel: r.difficultyLevel,
        releasedVersion: r.releasedVersion != null ? Number(r.releasedVersion) : null,
        logId: null,
        exScore: r.exScore,
        ...(bpi !== undefined && { bpi }),
        clearState: null,
        missCount: null,
        scoreAt: null,
        wrScore: r.wrScore ?? null,
        kaidenAvg: r.kaidenAvg ?? null,
        coef: r.coef ?? null,
        mu: r.mu ?? null,
        sigma: r.sigma ?? null,
        residualVar: r.residualVar ?? null,
        radarTop: radarTopOf(r.title, r.difficulty),
        areaId: r.areaId,
      };
    });

    return { result: ok(songs), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
