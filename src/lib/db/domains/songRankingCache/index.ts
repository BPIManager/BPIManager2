import { db } from "@/lib/db";
import { Database } from "@/types/db";
import { Insertable } from "kysely";

/** 1回のbulk INSERTに含める最大行数。 */
const INSERT_CHUNK_SIZE = 2000;

export type NewSongRankingCache = Insertable<Database["songRankingCache"]>;

/**
 * `songRankingCache` テーブル（楽曲別ランキング集計キャッシュ）へのアクセスを担当するリポジトリクラス。
 */
class SongRankingCacheRepository {
  /**
   * 指定バージョンの楽曲別ランキング（曲ごとの順位・総プレイヤー数）を、全ユーザー分まとめて1クエリで算出する。
   * ユーザー非依存の共通データのため、リクエストごとではなくここで一括算出する。
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
   * 指定バージョンのランキングキャッシュを、同一トランザクション内で全削除してから`INSERT_CHUNK_SIZE`件ずつ書き込み直す。
   * スコアの削除（バッチ削除・再インポート等）で消えた (user, song) の古い順位・総人数が残らないようにするため、UPSERTではなく入れ替える。
   * `rows`が空でも既存行は削除する（そのバージョンのスコアが全て無くなった場合）。
   *
   * @param version - 入れ替え対象のバージョン番号
   * @param rows - 書き込む行（全て同じバージョンの行）
   */
  async replaceForVersion(
    version: string,
    rows: NewSongRankingCache[],
  ): Promise<void> {
    await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("songRankingCache")
        .where("version", "=", version)
        .execute();
      for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
        await trx
          .insertInto("songRankingCache")
          .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
          .execute();
      }
    });
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
