import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * `scores` テーブル（単曲スコア）の書き込みを担当するリポジトリクラス。
 */
class ScoresRepository {
  /**
   * 指定バッチに紐づくスコアレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   * @param batchId - バッチ ID
   */
  async deleteByBatch(
    trx: Transaction<Database>,
    userId: string,
    batchId: string,
  ) {
    await trx
      .deleteFrom("scores")
      .where("batchId", "=", batchId)
      .where("userId", "=", userId)
      .execute();
  }
}

export const scoresRepo = new ScoresRepository();
