import type { NextApiRequest } from "next";
import { bpiOptimizerAggregateRepo } from "@/lib/db/aggregates/bpiOptimizer";
import { bpiOptimizerRepo } from "@/lib/db/domains/bpiOptimizer";
import { findOptimalBpiPath } from "@/lib/bpi/optimizer";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createOptimizeMemoBodySchema } from "@/schemas/optimizeMemo/create";
import type { RadarCategory } from "@/types/stats/radar";
import type {
  SongOptimizerInput,
  OptimizerOptions,
} from "@/types/bpi-optimizer";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

/**
 * bpi-optimizer / optimizeMemo（`analytics/bpi-optimizer`・`optimizeMemo/**`）の
 * subhandler 群。`HandlerResult` を返し、v1/v2 ルートから共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function authUidOf(req: NextApiRequest): string {
  return (req as AuthenticatedNextApiRequest).authUid;
}
function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/** GET /users/[userId]/analytics/bpi-optimizer （withUserApiHandler） */
export async function handleBpiOptimizer(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<unknown>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const targetBpi = parseFloat(String(req.query.targetBpi));
  const maxSteps = parseInt(String(req.query.maxSteps ?? "30"));

  if (isNaN(targetBpi) || targetBpi < -15 || targetBpi > 100) {
    return {
      result: err(400, "targetBpi must be a number between -15 and 100"),
      targetUserId: userId,
      viewerId,
    };
  }
  if (isNaN(maxSteps) || maxSteps < 1 || maxSteps > 400) {
    return {
      result: err(400, "maxSteps must be a number between 1 and 400"),
      targetUserId: userId,
      viewerId,
    };
  }

  const strategiesParam = String(req.query.strategies ?? "unplayed,played");
  const difficultiesParam = String(
    req.query.difficulties ?? "HYPER,ANOTHER,LEGGENDARIA",
  );
  const searchModeParam = String(req.query.searchMode ?? "flexible");
  const considerCurrentTotalBpi = req.query.considerCurrentTotalBpi !== "false";
  const radarElementsParam = String(
    req.query.radarElements ?? ALL_RADAR_CATEGORIES.join(","),
  );
  const selectedElements = radarElementsParam
    .split(",")
    .filter((e) =>
      ALL_RADAR_CATEGORIES.includes(e as RadarCategory),
    ) as RadarCategory[];

  try {
    const rawRows = await bpiOptimizerAggregateRepo.getAllSongsWithUserScores(
      userId,
      latestVersion,
    );

    if (rawRows.length === 0) {
      return {
        result: ok({
          steps: [],
          currentTotalBpi: -15,
          targetTotalBpi: targetBpi,
          achievable: false,
          alreadyAchieved: false,
          totalSongCount: 0,
        }),
        targetUserId: userId,
        viewerId,
      };
    }

    const radarCategoryBpis: Partial<Record<RadarCategory, number>> = {};
    const playedScores = rawRows
      .filter((r) => r.exScore !== null && r.bpi !== null)
      .map((r) => ({
        title: r.title,
        difficulty: r.difficulty,
        exScore: Number(r.exScore),
        notes: r.notes,
        bpi: r.bpi,
      }));

    if (playedScores.length > 0) {
      const radarResult = calculateRadar(playedScores);
      for (const cat of ALL_RADAR_CATEGORIES) {
        radarCategoryBpis[cat] = radarResult[cat].totalBpi;
      }
    }

    const validDifficulties = new Set<string>(IIDX_DIFFICULTIES);
    const candidateDifficulties = difficultiesParam
      .split(",")
      .filter((d) => validDifficulties.has(d));

    const songs: SongOptimizerInput[] = rawRows.map((r) => ({
      songId: r.songId,
      title: r.title,
      difficulty: r.difficulty,
      difficultyLevel: r.difficultyLevel,
      notes: r.notes,
      kaidenAvg: r.kaidenAvg != null ? Number(r.kaidenAvg) : null,
      wrScore: r.wrScore != null ? Number(r.wrScore) : null,
      coef: r.coef != null ? Number(r.coef) : null,
      currentBpi: r.bpi != null ? Number(r.bpi) : -15,
      currentExScore: r.exScore != null ? Number(r.exScore) : null,
      isUnplayed: r.bpi == null,
      radarCategory: topElementMap.get(`${r.title}___${r.difficulty}`) ?? null,
    }));

    const strategies = strategiesParam.split(",").filter(Boolean);
    const isFiltered = selectedElements.length < ALL_RADAR_CATEGORIES.length;
    const radarElementFilter = isFiltered ? selectedElements : null;

    const baseOptions: OptimizerOptions & {
      searchMode: "fastest" | "flexible";
    } = {
      includeUnplayed: strategies.includes("unplayed"),
      includePlayed: strategies.includes("played"),
      radarCategoryBpis,
      radarElementFilter,
      candidateLevels: [12],
      candidateDifficulties,
      searchMode: searchModeParam === "fastest" ? "fastest" : "flexible",
      considerCurrentTotalBpi,
    };

    let result = findOptimalBpiPath(
      songs,
      songs.length,
      targetBpi,
      baseOptions,
      maxSteps,
    );

    if (!result.achievable && !result.alreadyAchieved && isFiltered) {
      const fallbackOptions = { ...baseOptions, radarElementFilter: null };
      const fallbackResult = findOptimalBpiPath(
        songs,
        songs.length,
        targetBpi,
        fallbackOptions,
        maxSteps,
      );
      if (
        fallbackResult.achievable ||
        fallbackResult.steps.length > result.steps.length
      ) {
        const note =
          "選択された要素の楽曲のみでは目標に到達できなかったため、全楽曲から再探索しました。";
        result = {
          ...fallbackResult,
          autoAdjustmentNote: fallbackResult.autoAdjustmentNote
            ? `${note} ${fallbackResult.autoAdjustmentNote}`
            : note,
        };
      }
    }

    return { result: ok(result), targetUserId: userId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}

/** GET /users/[userId]/optimizeMemo （checkUserAccess: 公開なら他人も可） */
export async function handleOptimizeMemoList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = targetOf(req);
  try {
    const access = await checkUserAccess(req, uid);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: uid, viewerId };

    const memos = await bpiOptimizerRepo.getMemosByUserId(uid);
    return { result: ok(memos), targetUserId: uid, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}

/** POST /users/[userId]/optimizeMemo （withAuth、v1 は 201） */
export async function handleCreateOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ reportId: unknown }>> {
  const uid = authUidOf(req);
  const parsed = createOptimizeMemoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const reportId = await bpiOptimizerRepo.saveMemo(
      uid,
      parsed.data.targetBpi,
      parsed.data.reportData,
    );
    return { result: ok({ reportId }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** DELETE /users/[userId]/optimizeMemo/[memoId] （withAuth、v1 は 204） */
export async function handleDeleteOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ deleted: true }>> {
  const uid = authUidOf(req);
  const rid = String(req.query.memoId);
  try {
    const success = await bpiOptimizerRepo.deleteMemo(uid, rid);
    if (!success) {
      return {
        result: err(404, "Memo not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ deleted: true }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}
