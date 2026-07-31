import { db } from "@/lib/db";
import { scoresRepo } from "@/lib/db/scores";
import { allScoresRepo } from "@/lib/db/allScores";
import { userStatusLogsRepo } from "@/lib/db/userStatusLogs";

/**
 * 指定バッチに紐づくスコア・全難易度スコア・ステータスログ・ログレコードをトランザクションで削除する。
 */
export async function deleteBatch(userId: string, batchId: string) {
  return await db.transaction().execute(async (trx) => {
    await scoresRepo.deleteByBatch(trx, userId, batchId);
    await allScoresRepo.deleteByBatch(trx, userId, batchId);
    await userStatusLogsRepo.deleteByBatch(trx, userId, batchId);
    await trx
      .deleteFrom("logs")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  });
}
