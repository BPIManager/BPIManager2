import { db } from "@/lib/db";
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

  /**
   * バックアップ用にユーザーのレーダーキャッシュレコードを取得する。
   *
   * @param userId - ユーザー ID
   */
  async getAllForUser(userId: string) {
    return await db
      .selectFrom("userRadarCache")
      .selectAll()
      .where("userId", "=", userId)
      .execute();
  }

  /**
   * 指定ユーザー・バージョンのレーダーキャッシュレコードを1件取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getForUserAndVersion(userId: string, version: string) {
    return await db
      .selectFrom("userRadarCache")
      .select(["notes", "chord", "peak", "charge", "scratch", "soflan"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .executeTakeFirst();
  }
}

export const radarCacheRepo = new RadarCacheRepository();
