import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";

/**
 * トランザクション内の再判定で対象バッチが最新でなくなっていた場合に投げる（判定後・削除前の割り込み＝TOCTOU 競合を検出する）。
 */
export class BatchNotLatestError extends Error {
  constructor() {
    super("Batch is no longer the latest batch.");
    this.name = "BatchNotLatestError";
  }
}

/**
 * 指定バッチのスコア・全難易度スコア・ステータスログ・ログをトランザクションで削除する。
 * 最新バッチ判定は外で行うが、判定と削除の間の割り込み（TOCTOU）を防ぐため、トランザクション内で行ロック後に再判定する。
 *
 * @param version - 最新バッチ判定に使うバージョン番号
 */
export async function deleteBatch(
  userId: string,
  batchId: string,
  version: string,
) {
  return await db.transaction().execute(async (trx) => {
    await lockUserForWrite(trx, userId);
    const latestBatchId = await logBatchRepo.getLatestBatchIdForUpdate(
      trx,
      userId,
      version,
    );
    if (latestBatchId !== batchId) {
      throw new BatchNotLatestError();
    }

    await scoreWriteRepo.deleteByBatch(trx, userId, batchId);
    await allScoresRepo.deleteByBatch(trx, userId, batchId);
    await userStatusLogsWriteRepo.deleteByBatch(trx, userId, batchId);
    await logBatchRepo.deleteByBatch(trx, userId, batchId);
  });
}
