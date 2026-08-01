import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Insertable, sql } from "kysely";

/** 1回のbulk UPSERTに含める最大行数。 */
const UPSERT_CHUNK_SIZE = 2000;

export type NewSongRankingCache = Insertable<Database["songRankingCache"]>;

/**
 * `songRankingCache` テーブル（楽曲別ランキング集計キャッシュ）へのアクセスを担当するリポジトリクラス。
 */
class SongRankingCacheRepository {
  /**
   * ランキングキャッシュ行を`UPSERT_CHUNK_SIZE`件ずつのbulk UPSERTで書き込む。
   *
   * @param rows - 書き込み対象の行
   */
  async bulkUpsert(rows: NewSongRankingCache[]): Promise<void> {
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
      await db
        .insertInto("songRankingCache")
        .values(chunk)
        .onDuplicateKeyUpdate({
          rank: sql`VALUES(\`rank\`)`,
          totalPlayers: sql`VALUES(totalPlayers)`,
          updatedAt: sql`NOW()`,
        })
        .execute();
    }
  }

  /**
   * 指定ユーザー・バージョンの楽曲別ランキングキャッシュを取得する。
   *
   * @param userId - ユーザー ID
   * @param version - バージョン番号
   */
  async getForUserAndVersion(userId: string, version: string) {
    return await db
      .selectFrom("songRankingCache")
      .select(["songId", "rank", "totalPlayers"])
      .where("userId", "=", userId)
      .where("version", "=", version)
      .execute();
  }
}

export const songRankingCacheRepo = new SongRankingCacheRepository();
