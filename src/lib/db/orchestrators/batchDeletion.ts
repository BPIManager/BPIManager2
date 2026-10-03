import { db } from "@/lib/db";
import { lockUserForWrite } from "@/lib/db/shared/userWriteLock";
import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { userStatusLogsWriteRepo } from "@/lib/db/domains/userStatusLogs/write";
import { logBatchRepo } from "@/lib/db/domains/logs/batch";

/**
 * トランザクション内での再判定時に対象バッチが最新でなくなっていた場合に
 * 投げるエラー（呼び出し元判定後、削除前に新しいバッチが割り込むTOCTOU
 * 競合を検出するため）。
 */
export class BatchNotLatestError extends Error {
  constructor() {
    super("Batch is no longer the latest batch.");
    this.name = "BatchNotLatestError";
  }
}

/**
 * 指定バッチに紐づくスコア・全難易度スコア・ステータスログ・ログレコードをトランザクションで削除する。
 *
 * 呼び出し元（`handleBatchDelete`）はトランザクション外で「最新バッチか」を
 * 事前判定しているが、判定と削除の間に新しいバッチが割り込むTOCTOU競合を
 * 防ぐため、削除直前にトランザクション内で行ロックを取得して再判定する。
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
