import { db } from "@/lib/db";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";

/**
 * 指定バッチに紐づくスコア・全難易度スコア・ステータスログ・ログレコードをトランザクションで削除する。
 */
export async function deleteBatch(userId: string, batchId: string) {
  return await db.transaction().execute(async (trx) => {
    await scoresRepo.deleteByBatch(trx, userId, batchId);
    await allScoresRepo.deleteByBatch(trx, userId, batchId);
    await userStatusLogsRepo.deleteByBatch(trx, userId, batchId);
    await navigationRepo.deleteByBatch(trx, userId, batchId);
  });
}
