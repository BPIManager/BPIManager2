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
   * 指定バージョンの楽曲別ランキング（各ユーザーの最新スコアに基づく曲ごとの順位・総プレイヤー数）を
   * `allScores`の最新ログから全ユーザー分まとめて1回のクエリで算出する。
   *
   * `songRankingCache`はリクエストしたユーザーに依存しない全ユーザー共通のデータのため、
   * ユーザーごとに都度算出するのではなく、ここで全ユーザー分を一括算出する。
   *
   * @param version - バージョン番号
   */
  async calculateForVersion(version: string): Promise<NewSongRankingCache[]> {
    const rows = await db
      .with("per_song_latest", (db) =>
        db
          .selectFrom("allScores as s")
          .innerJoin(
            (qb) =>
              qb
                .selectFrom("allScores")
                .select([
                  "userId",
                  "songId",
                  (eb) => eb.fn.max("logId").as("maxLogId"),
                ])
                .where("version", "=", version)
                .groupBy(["userId", "songId"])
                .as("m"),
            (join) =>
              join
                .onRef("m.maxLogId", "=", "s.logId")
                .onRef("m.userId", "=", "s.userId")
                .onRef("m.songId", "=", "s.songId"),
          )
          .select((eb) => [
            "s.userId",
            "s.songId",
            eb.fn
              .agg<number>("rank", [])
              .over((ob) =>
                ob.partitionBy("s.songId").orderBy("s.exScore", "desc"),
              )
              .as("rnk"),
            eb.fn
              .countAll<number>()
              .over((ob) => ob.partitionBy("s.songId"))
              .as("totalPlayers"),
          ]),
      )
      .selectFrom("per_song_latest")
      .selectAll()
      .execute();

    return rows.map((r) => ({
      userId: r.userId,
      version,
      songId: r.songId,
      rank: Number(r.rnk),
      totalPlayers: Number(r.totalPlayers),
    }));
  }

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
