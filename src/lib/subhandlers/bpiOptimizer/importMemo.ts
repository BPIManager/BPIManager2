import type { NextApiRequest } from "next";
import { bpiOptimizerRepo } from "@/lib/db/domains/bpiOptimizer/memos";
import { bpiOptimizerAggregateRepo } from "@/lib/db/aggregates/bpiOptimizer";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { targetOf, type HandleOutcome } from "./_shared";

export interface ImportedGoalTarget {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  toExScore: number;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
}

/**
 * 他ユーザーが共有した reportId の曲目（songId＋目標EXスコア）を、インポート先の視点で最新の曲データから引き直して返す。
 * 共有元の fromBpi 等はインポート先のプレイ状況と無関係なため使わず、songId と toExScore のみ引き継ぐ。
 */
export async function handleImportOptimizeMemo(
  req: NextApiRequest,
): Promise<HandleOutcome<{ targets: ImportedGoalTarget[] }>> {
  const userId = targetOf(req);
  const reportId =
    typeof req.query.reportId === "string" ? req.query.reportId : "";
  if (!reportId) {
    return {
      result: err(400, "reportId is required"),
      targetUserId: userId,
      viewerId: null,
    };
  }

  try {
    const memo = await bpiOptimizerRepo.getMemoByReportId(reportId);
    if (!memo) {
      return {
        result: err(404, "Memo not found"),
        targetUserId: userId,
        viewerId: null,
      };
    }

    const songRows = await bpiOptimizerAggregateRepo.getAllSongsWithUserScores(
      userId,
      latestVersion,
    );
    const rowBySongId = new Map(songRows.map((r) => [r.songId, r]));

    const targets: ImportedGoalTarget[] = (memo.reportData.steps ?? [])
      .map((step) => {
        const row = rowBySongId.get(step.songId);
        if (!row) return null;
        const maxScore = row.notes * 2;
        return {
          songId: row.songId,
          title: row.title,
          difficulty: row.difficulty,
          difficultyLevel: row.difficultyLevel,
          notes: row.notes,
          toExScore: Math.min(maxScore, Math.max(0, step.toExScore)),
          wrScore: row.wrScore != null ? Number(row.wrScore) : null,
          kaidenAvg: row.kaidenAvg != null ? Number(row.kaidenAvg) : null,
          coef: row.coef != null ? Number(row.coef) : null,
          mu: row.mu != null ? Number(row.mu) : null,
          sigma: row.sigma != null ? Number(row.sigma) : null,
          residualVar: row.residualVar != null ? Number(row.residualVar) : null,
        };
      })
      .filter((t): t is ImportedGoalTarget => t != null);

    return { result: ok({ targets }), targetUserId: userId, viewerId: userId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId: null,
    };
  }
}
