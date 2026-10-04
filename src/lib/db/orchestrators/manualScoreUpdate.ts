import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { latestScoresRepo } from "@/lib/db/domains/scores/latest";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { BpiCalculator } from "@/lib/bpi";
import { getManualBatchPrefix, mintManualBatchId } from "@/lib/scores/manualBatchId";

type ScoreRow = Awaited<ReturnType<typeof latestScoresRepo.getLatestScores>>[number];

interface ManualScoreInput {
  songId: number;
  definitionId: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
}

interface ManualAllScoreInput {
  songId: number;
  exScore: number;
  bpi: number | null;
  clearState: string | null;
  missCount: number | null;
}

/**
 * 手動スコア編集を1トランザクションで保存する。同日の保存は当日プレフィックスの batchId に集約し、一致しなければ新規発行する。
 * score（☆11/12）と allScore（☆10以下）は独立に保存し、score が無ければ logs/userStatusLogs には触れない。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.score - 保存する単曲スコア（改善が無ければ渡さない）
 * @param params.allScore - 全難易度履歴側のスコア（改善が無ければ渡さない）
 * @param params.computeTotalBpi - ロック取得後の最新スコアから総合BPIを算出する関数（score がある場合は必須、ラチェット適用前）
 * @returns 保存した総合BPI（score が無ければ null）と使用した batchId
 */
export async function saveManualScoreUpdate(params: {
  userId: string;
  version: string;
  score?: ManualScoreInput;
  allScore?: ManualAllScoreInput;
  computeTotalBpi?: (currentScores: ScoreRow[]) => number;
}): Promise<{ totalBpi: number | null; batchId: string }> {
  const { userId, version, score, allScore, computeTotalBpi } = params;

  const prefix = getManualBatchPrefix(userId, version);
  const lastPlayed = new Date();

  return await db.transaction().execute(async (trx) => {
    await lockUserForWrite(trx, userId);
    // 判定と書き込みの間に別インポートが割り込むと古い batchId を再利用するため、判定時に logs 最新行を FOR UPDATE でロックして直列化する。
     // score（☆11/12）は logs 側で判定・ロックし、allScore のみ（☆10以下）は logs に触れないため allScores から判定する。
    const currentLatestBatchId = score
      ? await logBatchRepo.getLatestBatchIdForUpdate(trx, userId, version)
      : await allScoresRepo.getLatestBatchId(userId, version, trx);
    const batchId = currentLatestBatchId?.startsWith(prefix)
      ? currentLatestBatchId
      : mintManualBatchId(userId, version);

    let totalBpi: number | null = null;

    // scores.batchId は logs.batchId への外部キーのため、logs の行を先に用意してから scores へ書き込む（CSV インポートと同じ順序）。
    if (score) {
      const latestLog = await userStatusLogsReadRepo.getLatestArenaRank(
        trx,
        userId,
        version,
      );
      const currentArenaRank = latestLog?.arenaRank ?? null;

      const previousBest = await userStatusLogsReadRepo.getMaxTotalBpi(
        trx,
        userId,
        version,
      );
      const lockedScores = await latestScoresRepo.getLatestScores(
        userId,
        version,
        trx,
      );
      totalBpi = BpiCalculator.ratchetTotalBpi(
        previousBest,
        computeTotalBpi?.(lockedScores) ?? previousBest ?? -15,
      );

      await logBatchRepo.upsertManualBatch(trx, {
        userId,
        version,
        batchId,
        totalBpi,
      });
      await userStatusLogsWriteRepo.upsertManualBatch(trx, {
        userId,
        version,
        batchId,
        totalBpi,
        arenaRank: currentArenaRank,
      });

      await scoreWriteRepo.upsertManual(trx, {
        userId,
        songId: score.songId,
        definitionId: score.definitionId,
        version,
        batchId,
        exScore: score.exScore,
        bpi: score.bpi,
        clearState: score.clearState,
        missCount: score.missCount,
        lastPlayed,
      });
    }

    if (allScore) {
      await allScoresRepo.upsertManual(trx, {
        userId,
        songId: allScore.songId,
        version,
        batchId,
        exScore: allScore.exScore,
        bpi: allScore.bpi,
        clearState: allScore.clearState,
        missCount: allScore.missCount,
        lastPlayed,
      });
    }

    return { totalBpi, batchId };
  });
}
