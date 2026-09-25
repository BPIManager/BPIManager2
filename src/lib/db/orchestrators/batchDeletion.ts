import { db } from "@/lib/db";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";

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
    const latestBatchId = await navigationRepo.getLatestBatchIdForUpdate(
      trx,
      userId,
      version,
    );
    if (latestBatchId !== batchId) {
      throw new BatchNotLatestError();
    }

    await scoresRepo.deleteByBatch(trx, userId, batchId);
    await allScoresRepo.deleteByBatch(trx, userId, batchId);
    await userStatusLogsRepo.deleteByBatch(trx, userId, batchId);
    await navigationRepo.deleteByBatch(trx, userId, batchId);
  });
}
