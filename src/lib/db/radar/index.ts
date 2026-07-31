import { Database } from "@/types/db";
import { Transaction } from "kysely";

/**
 * `userRadarCache` テーブル（レーダーチャート集計キャッシュ）の書き込みを担当するリポジトリクラス。
 */
class RadarCacheRepository {
  /**
   * ユーザーのレーダーキャッシュレコードを削除する。
   *
   * @param trx - 呼び出し元が管理するトランザクション
   * @param userId - ユーザー ID
   */
  async deleteByUser(trx: Transaction<Database>, userId: string) {
    await trx
      .deleteFrom("userRadarCache")
      .where("userId", "=", userId)
      .execute();
  }
}

export const radarCacheRepo = new RadarCacheRepository();
