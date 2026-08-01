import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Insertable, Transaction, sql } from "kysely";

/** 1回のbulk UPSERTに含める最大行数。 */
const UPSERT_CHUNK_SIZE = 500;

export type NewUserRadarCache = Insertable<Database["userRadarCache"]>;

/**
 * `userRadarCache` テーブル（レーダーチャート集計キャッシュ）の書き込みを担当するリポジトリクラス。
 */
class RadarCacheRepository {
  /**
   * レーダーキャッシュ行を`UPSERT_CHUNK_SIZE`件ずつのbulk UPSERTで書き込む。
   *
   * @param rows - 書き込み対象の行
   */
  async bulkUpsert(rows: NewUserRadarCache[]): Promise<void> {
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
      await db
        .insertInto("userRadarCache")
        .values(chunk)
        .onDuplicateKeyUpdate({
          notes: sql`VALUES(notes)`,
          chord: sql`VALUES(chord)`,
          peak: sql`VALUES(peak)`,
          charge: sql`VALUES(charge)`,
          scratch: sql`VALUES(scratch)`,
          soflan: sql`VALUES(soflan)`,
          totalBpi: sql`VALUES(totalBpi)`,
          updatedAt: sql`NOW()`,
        })
        .execute();
    }
  }

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
