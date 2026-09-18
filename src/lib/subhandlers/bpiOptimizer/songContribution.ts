import type { NextApiRequest } from "next";
import { bpiOptimizerAggregateRepo } from "@/lib/db/aggregates/bpiOptimizer";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { BpiCalculator } from "@/lib/bpi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { songContributionBodySchema } from "@/schemas/optimizeMemo/songContribution";
import { targetOf, type HandleOutcome } from "./_shared";
import type {
  IBpiBasicSongData,
  IBpiScoreObservation,
} from "@/types/songs/bpi";

export interface SongContributionResult {
  currentTotalBpi: number;
  contributions: { songId: number; contribution: number }[];
}

/**
 * POST /users/[userId]/analytics/bpi-optimizer/song-contribution （withUserApiHandler）
 *
 * 保存済みの目標について、「プラン保存時点からの実際のスコア更新が、現在の
 * 総合BPIにどれだけ効いているか」を曲ごとに算出する。
 *
 * 総合BPIはべき乗平均のため単曲BPIの差分をそのまま足せないので、各曲について
 * 「現在の総合BPI」と「その曲だけを保存時点(baselineExScore)のスコアに
 * 戻した場合の総合BPI」を比較した差分を寄与度とする。
 */
export async function handleSongContribution(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<SongContributionResult>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;
  const parsed = songContributionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
      targetUserId: userId,
      viewerId,
    };
  }

  try {
    const rawRows = await bpiOptimizerAggregateRepo.getAllSongsWithUserScores(
      userId,
      latestVersion,
    );
    const rowBySongId = new Map(rawRows.map((r) => [r.songId, r]));

    // 存在しない曲（曲データ削除等）はリクエスト全体を失敗させず、
    // その曲だけ無視して残りを処理する
    const validTargets = parsed.data.targets.filter((target) =>
      rowBySongId.has(target.songId),
    );

    const allSongs: (IBpiBasicSongData & { songId: number })[] = rawRows.map(
      (r) => ({
        songId: r.songId,
        notes: r.notes,
        kaidenAvg: r.kaidenAvg != null ? Number(r.kaidenAvg) : null,
        wrScore: r.wrScore != null ? Number(r.wrScore) : null,
        coef: r.coef != null ? Number(r.coef) : null,
        mu: r.mu != null ? Number(r.mu) : null,
        sigma: r.sigma != null ? Number(r.sigma) : null,
        residualVar: r.residualVar != null ? Number(r.residualVar) : null,
      }),
    );

    const currentScoreBySongId = new Map<number, number>(
      rawRows
        .filter((r) => r.exScore != null)
        .map((r) => [r.songId, Number(r.exScore)]),
    );

    const currentObservations: IBpiScoreObservation[] = allSongs
      .filter((s) => currentScoreBySongId.has(s.songId))
      .map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: currentScoreBySongId.get(s.songId)!,
      }));
    const currentTotalBpi = BpiCalculator.calculateTotalBPI(
      currentObservations,
      allSongs,
    );

    const contributions = validTargets.map((target) => {
      const revertedScores = new Map(currentScoreBySongId);
      if (target.baselineExScore == null) {
        revertedScores.delete(target.songId);
      } else {
        revertedScores.set(target.songId, target.baselineExScore);
      }
      const revertedObservations: IBpiScoreObservation[] = allSongs
        .filter((s) => revertedScores.has(s.songId))
        .map((s) => ({
          songId: s.songId,
          notes: s.notes,
          exScore: revertedScores.get(s.songId)!,
        }));
      const revertedTotalBpi = BpiCalculator.calculateTotalBPI(
        revertedObservations,
        allSongs,
      );
      return {
        songId: target.songId,
        contribution: currentTotalBpi - revertedTotalBpi,
      };
    });

    return {
      result: ok({ currentTotalBpi, contributions }),
      targetUserId: userId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}
