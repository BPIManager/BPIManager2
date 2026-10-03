import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { BpiCalculator } from "@/lib/bpi";
import { getManualBatchPrefix, mintManualBatchId } from "@/lib/scores/manualBatchId";

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
 * 手動スコア編集を1トランザクションで保存する。
 *
 * 同日内の複数回の保存は、当日の手動プレフィックスを持つ batchId に集約する。最新の batchId が
 * プレフィックスと一致しない場合は新しい batchId を発行する（`logs.batchId` は UNIQUE のため）。
 * `score`（☆11/12）と `allScore`（☆10以下の全難易度履歴）はそれぞれ独立に保存し、
 * `score` が無い場合は `logs` / `userStatusLogs` に触れない。
 *
 * @param params.userId - ユーザー ID
 * @param params.version - バージョン番号
 * @param params.score - 保存する単曲スコア（改善が無ければ渡さない）
 * @param params.allScore - 全難易度履歴側のスコア（改善が無ければ渡さない）
 * @param params.newTotalBpi - 今回算出した総合BPI（`score` がある場合は必須、ラチェット適用前）
 * @returns 保存した総合BPI（`score` が無ければ `null`）と使用した batchId
 */
export async function saveManualScoreUpdate(params: {
  userId: string;
  version: string;
  score?: ManualScoreInput;
  allScore?: ManualAllScoreInput;
  newTotalBpi?: number;
}): Promise<{ totalBpi: number | null; batchId: string }> {
  const { userId, version, score, allScore, newTotalBpi } = params;

  const prefix = getManualBatchPrefix(userId, version);
  const lastPlayed = new Date();

  return await db.transaction().execute(async (trx) => {
    await lockUserForWrite(trx, userId);
    // 判定と書き込みの間に別のインポートが割り込むと古いbatchIdを再利用するため、
    // 判定時に logs の最新行をFOR UPDATEで行ロックし、同一ユーザーの保存を直列化する
    // `score`(scores/songDefドメイン、☆11/12)がある更新は`logs`側から判定・ロックできる。
    // `allScore`のみ(☆10以下)の更新は`logs`に一切触れないため、`allScores`自体から判定する
    const currentLatestBatchId = score
      ? await logBatchRepo.getLatestBatchIdForUpdate(trx, userId, version)
      : await allScoresRepo.getLatestBatchId(userId, version);
    const batchId = currentLatestBatchId?.startsWith(prefix)
      ? currentLatestBatchId
      : mintManualBatchId(userId, version);

    let totalBpi: number | null = null;

    // `scores.batchId`は`logs.batchId`への外部キーのため、`logs`側の行を
    // 先に用意してから`scores`へ書き込む必要がある（CSVインポート
    // `executeSaveBpiSystem`と同じ順序）。
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
      totalBpi = BpiCalculator.ratchetTotalBpi(
        previousBest,
        newTotalBpi ?? previousBest ?? -15,
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
