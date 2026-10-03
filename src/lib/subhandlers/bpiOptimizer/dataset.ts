import type { NextApiRequest } from "next";
import { bpiOptimizerAggregateRepo } from "@/lib/db/aggregates/bpiOptimizer";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

/**
 * BPI最適化対象（☆12）の曲ごとのEXスコアを、指定データセット（特定バージョン or 全バージョン横断の自己歴代ベスト）で返す。
 * 「自己べを目指す」用途向け。未プレイ曲も NULL スコアとして含める。
 */
export async function handleBpiOptimizerDataset(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<unknown>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;
  const sourceParam =
    typeof req.query.source === "string" ? req.query.source : "";
  const useSelfBest = sourceParam === "self-best";
  const resolvedVersion: IIDXVersion = (
    IIDX_VERSIONS as readonly string[]
  ).includes(sourceParam)
    ? (sourceParam as IIDXVersion)
    : latestVersion;

  try {
    const rawRows = useSelfBest
      ? await bpiOptimizerAggregateRepo.getAllSongsWithSelfBestScores(userId)
      : await bpiOptimizerAggregateRepo.getAllSongsWithUserScores(
          userId,
          resolvedVersion,
        );

    const result = rawRows.map((r) => ({
      songId: Number(r.songId),
      title: r.title,
      difficulty: r.difficulty,
      difficultyLevel: Number(r.difficultyLevel),
      notes: Number(r.notes),
      exScore: r.exScore !== null ? Number(r.exScore) : null,
      wrScore: r.wrScore !== null ? Number(r.wrScore) : null,
      kaidenAvg: r.kaidenAvg !== null ? Number(r.kaidenAvg) : null,
      coef: r.coef !== null ? Number(r.coef) : null,
      mu: r.mu !== null ? Number(r.mu) : null,
      sigma: r.sigma !== null ? Number(r.sigma) : null,
      residualVar: r.residualVar !== null ? Number(r.residualVar) : null,
    }));

    return { result: ok(result), targetUserId: userId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}
